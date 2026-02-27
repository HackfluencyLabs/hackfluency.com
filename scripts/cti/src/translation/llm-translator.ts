/**
 * LLM Translator - Sistema de traducción de dashboard CTI usando TranslateGemma
 * 
 * Arquitectura:
 * 1. Extrae strings traducibles del JSON (filtrando campos técnicos)
 * 2. Usa translategemma:4b vía Ollama para traducir
 * 3. Sistema de cache persistente para evitar re-traducciones
 * 4. Reconstruye el JSON manteniendo estructura original
 * 
 * Diseñado para multi-idioma: cambiar MODEL y TARGET_LANG para otros idiomas
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

// Configuración
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const TRANSLATION_MODEL = process.env.TRANSLATION_MODEL || 'zongwei/gemma3-translator:1b';
const TARGET_LANGUAGE = process.env.TARGET_LANGUAGE || 'Spanish (Latin America)';
const BATCH_SIZE = parseInt(process.env.TRANSLATION_BATCH_SIZE || '5', 10);
const CACHE_TTL_DAYS = parseInt(process.env.TRANSLATION_CACHE_TTL || '7', 10);

// Campos que SÍ se traducen
const TRANSLATABLE_FIELDS = new Set([
  'headline',
  'summary',
  'keyFindings',
  'recommendedActions',
  'title',
  'themes',
  'excerpt',
  'threatLandscape',
  'analystBrief',
  'technicalAssessment',
  'keywords',
  'methodologies',
  'narrative',
  'explanation',
  'rationale',
  'reasoning',
]);

// Campos que NUNCA se traducen
const NON_TRANSLATABLE_FIELDS = new Set([
  'id',
  'version',
  'generatedAt',
  'validUntil',
  'timestamp',
  'lastUpdate',
  'lastSeen',
  'firstSeen',
  'cves',
  'domains',
  'ips',
  'country',
  'port',
  'count',
  'percentage',
  'killChainPhase',
  'service',
  'model',
  'killChainPhase',
  'correlationStrength',
  'riskLevel',
  'trend',
  'tone',
  'severity',
  'category',
  'confidenceLevel',
  'url',
  'author',
  'displayName',
  'username',
  'name',
  'org',
  'asn',
  'isp',
  'city',
  'os',
  'product',
  'version',
  'type',
  'classification',
  'urgency',
  'confidence',
  'ip',
  'tweetId',
  'hashtags',
  'mentions',
  'source',
  'permalink',
]);

// Patrones que indican contenido técnico/no traducible
const TECHNICAL_PATTERNS = [
  /^CVE-\d{4}-\d+/i, // CVEs
  /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IPs
  /^(http|https):\/\//, // URLs
  /^\d{4}-\d{2}-\d{2}T/, // ISO timestamps
  /^[A-Z]{2}$/, // Country codes
  /^\d+:\d+$/, // Port:Service
  /^[a-f0-9]{32,64}$/i, // Hashes
  /^v?\d+\.\d+/, // Version numbers
  /^@\w+/, // Usernames
  /^#\w+/, // Hashtags
];

interface CacheEntry {
  original: string;
  translated: string;
  timestamp: string;
  model: string;
}

interface TranslationCache {
  [hash: string]: CacheEntry;
}

export class LLMTranslator {
  private cache: Map<string, CacheEntry>;
  private cacheFile: string;
  private outputDir: string;

  constructor() {
    this.cache = new Map();
    this.outputDir = process.env.CTI_OUTPUT_DIR || './DATA/cti-output';
    this.cacheFile = path.join(
      process.env.CTI_CACHE_DIR || './DATA/cti-cache',
      'translation-cache.json'
    );
  }

  /**
   * Traduce el dashboard completo
   */
  async translateDashboard(dashboard: any): Promise<any> {
    console.log('[LLMTranslator] Starting translation process...');

    // Cargar cache
    await this.loadCache();

    // Extraer strings
    console.log('[LLMTranslator] Extracting translatable strings...');
    const stringsMap = this.extractTranslatableStrings(dashboard);
    console.log(`[LLMTranslator] Found ${stringsMap.size} unique strings to translate`);

    if (stringsMap.size === 0) {
      console.log('[LLMTranslator] No strings to translate, returning original');
      return dashboard;
    }

    // Separar cached vs nuevos
    const toTranslate: string[] = [];
    const translations = new Map<string, string>();

    for (const [original] of stringsMap) {
      const cached = this.getCachedTranslation(original);
      if (cached) {
        translations.set(original, cached);
      } else {
        toTranslate.push(original);
      }
    }

    console.log(`[LLMTranslator] ${translations.size} from cache, ${toTranslate.length} to translate`);

    // Traducir nuevos strings
    if (toTranslate.length > 0) {
      console.log(`[LLMTranslator] Translating ${toTranslate.length} strings with ${TRANSLATION_MODEL}...`);
      const newTranslations = await this.translateBatch(toTranslate);

      toTranslate.forEach((str, idx) => {
        const translated = newTranslations[idx] || str;
        translations.set(str, translated);
        this.addToCache(str, translated);
      });

      // Guardar cache actualizado
      await this.saveCache();
    }

    // Reconstruir JSON
    console.log('[LLMTranslator] Reconstructing translated dashboard...');
    const translatedDashboard = this.reconstructJson(dashboard, translations);

    console.log('[LLMTranslator] Translation completed successfully');
    return translatedDashboard;
  }

  /**
   * Extrae strings traducibles del JSON
   */
  private extractTranslatableStrings(obj: any): Map<string, string> {
    const strings = new Map<string, string>();
    const seen = new Set<string>();

    const traverse = (current: any, path: string[] = []) => {
      if (typeof current === 'string') {
        const fieldName = path[path.length - 1] || '';

        if (this.shouldTranslate(fieldName, current) && !seen.has(current)) {
          strings.set(current, '');
          seen.add(current);
        }
      } else if (Array.isArray(current)) {
        current.forEach((item, idx) => traverse(item, [...path, idx.toString()]));
      } else if (current && typeof current === 'object') {
        Object.entries(current).forEach(([key, value]) => {
          traverse(value, [...path, key]);
        });
      }
    };

    traverse(obj);
    return strings;
  }

  /**
   * Determina si un campo debe traducirse
   */
  private shouldTranslate(fieldName: string, value: string): boolean {
    // No traducir si está en blacklist explícito
    if (NON_TRANSLATABLE_FIELDS.has(fieldName)) {
      return false;
    }

    // Traducir si está en whitelist explícito
    if (TRANSLATABLE_FIELDS.has(fieldName)) {
      return !this.isTechnicalValue(value);
    }

    // No traducir si parece técnico
    if (this.isTechnicalValue(value)) {
      return false;
    }

    // No traducir strings muy cortos (probablemente nombres propios o códigos)
    const wordCount = value.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount <= 2 && value.length < 20) {
      return false;
    }

    // No traducir si solo contiene números y símbolos
    if (!/[a-zA-Z]/.test(value)) {
      return false;
    }

    return true;
  }

  /**
   * Verifica si un valor es técnico/no traducible
   */
  private isTechnicalValue(value: string): boolean {
    return TECHNICAL_PATTERNS.some(pattern => pattern.test(value));
  }

  /**
   * Detecta si el texto tiene caracteres problemáticos para el modelo
   */
  private hasProblematicChars(text: string): boolean {
    return /\*\*/.test(text) || /^\*|\*$/.test(text);
  }

  /**
   * Reconstruye el formato original (asteriscos) en la traducción
   */
  private reconstructFormat(original: string, translated: string): string {
    // Extraer solo asteriscos del original
    const asterisks = original.replace(/[^*]/g, '');
    // Si no hay asteriscos, devolver traducción limpia
    if (asterisks.length === 0) return translated;
    // Reconstruir: prepend y append asteriscos a la traducción
    const opening = asterisks.substring(0, Math.floor(asterisks.length / 2));
    return `${opening}${translated}${closing}`;
  }

  /**
   * Traduce un batch de strings uno por uno para mejor calidad
   */

   * Traduce un batch de strings uno por uno para mejor calidad
   */
  private async translateBatch(strings: string[]): Promise<string[]> {
    const results: string[] = [];

    // TranslateGemma funciona mejor con texto individual
    for (let i = 0; i < strings.length; i++) {
      const text = strings[i];
      console.log(`[LLMTranslator] Translating ${i + 1}/${strings.length} (${text.length} chars)`);

      try {
        let translated: string;
        if (this.hasProblematicChars(text)) {
          // Limpiar asteriscos antes de traducir
          const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
          const cleanTranslated = await this.callTranslateGemma(cleanText);
          // Reconstruir formato original
          translated = this.reconstructFormat(text, cleanTranslated);
        } else {
          translated = await this.callTranslateGemma(text);
        }
        results.push(translated);
      } catch (error) {
        console.error(`[LLMTranslator] Translation failed for string ${i}:`, error);
        // Fallback: mantener original
        results.push(text);
      }
    }

    return results;
  }

  /**
   * Llama a translategemma via Ollama para un solo texto
   * Timeout proporcional al tamaño del texto (aprox 1000 chars por minuto)
   */
  private async callTranslateGemma(text: string, attempt: number = 1): Promise<string> {
    const prompt = this.buildTranslationPrompt(text);

    // Calcular timeout basado en longitud del texto
    // Base: 30 segundos + 3 segundos por cada 100 caracteres
    const timeoutMs = Math.min(30000 + (text.length * 30), 300000); // Max 5 minutos

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[LLMTranslator] Calling Ollama (${text.length} chars, timeout: ${Math.round(timeoutMs/1000)}s, attempt: ${attempt})`);

      const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: TRANSLATION_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 1,
            num_predict: Math.min(text.length * 3, 16000),
            top_p: 0.95,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama HTTP ${response.status}`);
      }

      const data = await response.json() as { response: string };
      return data.response.trim();
    } catch (error) {
      if (attempt < 3) {
        console.log(`[LLMTranslator] Attempt ${attempt} failed, retrying in ${attempt * 2}s...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        return this.callTranslateGemma(text, attempt + 1);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Construye el prompt para translategemma siguiendo documentación oficial
   */
  return `Translate from English to Spanish: ${text}

  Provide ONLY the Spanish translation. Do NOT include the prompt, do NOT add explanations.`;



  /**
   * Reconstruye el JSON con las traducciones
   */
  private reconstructJson(original: any, translations: Map<string, string>): any {
    // Deep clone
    const result = JSON.parse(JSON.stringify(original));

    const traverseAndReplace = (current: any, path: string[] = []) => {
      if (typeof current === 'string') {
        const translated = translations.get(current);
        if (translated) {
          this.setValueAtPath(result, path, translated);
        }
      } else if (Array.isArray(current)) {
        current.forEach((item, idx) => traverseAndReplace(item, [...path, idx.toString()]));
      } else if (current && typeof current === 'object') {
        Object.entries(current).forEach(([key, value]) => {
          traverseAndReplace(value, [...path, key]);
        });
      }
    };

    traverseAndReplace(original);
    return result;
  }

  /**
   * Establece un valor en una ruta del objeto
   */
  private setValueAtPath(obj: any, path: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!(key in current)) {
        console.warn(`[LLMTranslator] Path not found: ${path.join('.')}`);
        return;
      }
      current = current[key];
    }
    const lastKey = path[path.length - 1];
    if (current && typeof current === 'object') {
      current[lastKey] = value;
    }
  }

  /**
   * Carga el cache desde disco
   */
  private async loadCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const parsed: TranslationCache = JSON.parse(data);

      // Filtrar entradas expiradas
      const now = new Date();
      const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

      Object.entries(parsed).forEach(([hash, entry]) => {
        const entryDate = new Date(entry.timestamp);
        if (now.getTime() - entryDate.getTime() < ttlMs) {
          this.cache.set(hash, entry);
        }
      });

      console.log(`[LLMTranslator] Loaded ${this.cache.size} cached translations`);
    } catch {
      console.log('[LLMTranslator] No translation cache found, starting fresh');
      this.cache = new Map();
    }
  }

  /**
   * Guarda el cache en disco
   */
  private async saveCache(): Promise<void> {
    try {
      // Asegurar que existe el directorio
      await fs.mkdir(path.dirname(this.cacheFile), { recursive: true });

      const data: TranslationCache = Object.fromEntries(this.cache);
      await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2));
      console.log(`[LLMTranslator] Saved ${this.cache.size} translations to cache`);
    } catch (error) {
      console.error('[LLMTranslator] Failed to save cache:', error);
    }
  }

  /**
   * Obtiene traducción del cache
   */
  private getCachedTranslation(text: string): string | null {
    const hash = this.hashText(text);
    const entry = this.cache.get(hash);
    return entry?.translated || null;
  }

  /**
   * Agrega traducción al cache
   */
  private addToCache(original: string, translated: string): void {
    const hash = this.hashText(original);
    this.cache.set(hash, {
      original,
      translated,
      timestamp: new Date().toISOString(),
      model: TRANSLATION_MODEL,
    });
  }

  /**
   * Genera hash de un texto
   */
  private hashText(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }
}

export default LLMTranslator;
