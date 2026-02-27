/**
 * LLM Translator - Stable CTI translation flow (legacy architecture)
 *
 * Based on previously stable behavior:
 * 1) Extract translatable strings from JSON
 * 2) Translate string-by-string with Ollama model
 * 3) Persist cache to avoid re-translations
 * 4) Reconstruct JSON preserving structure
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const TRANSLATION_MODEL = process.env.OLLAMA_MODEL_TRANSLATOR || process.env.TRANSLATION_MODEL || 'zongwei/gemma3-translator:1b';
const BATCH_SIZE = parseInt(process.env.TRANSLATION_BATCH_SIZE || '5', 10);
const CACHE_TTL_DAYS = parseInt(process.env.TRANSLATION_CACHE_TTL || '7', 10);
const ENABLE_TRANSLATION_CACHE = process.env.TRANSLATION_CACHE_ENABLED === 'true';

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


const TECHNICAL_PATTERNS: RegExp[] = [];


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

  constructor() {
    this.cache = new Map();
    this.cacheFile = path.join(
      process.env.CTI_CACHE_DIR || './DATA/cti-cache',
      'translation-cache.json'
    );
  }

  async translateDashboard(dashboard: any): Promise<any> {
    console.log('[LLMTranslator] Starting translation process...');

    if (ENABLE_TRANSLATION_CACHE) {
      await this.loadCache();
    }

    const strings = this.extractTranslatableStrings(dashboard);
    console.log(`[LLMTranslator] Found ${strings.size} unique strings to translate`);

    const translations = new Map<string, string>();
    let index = 0;

    for (const text of strings) {
      index++;
      const cached = ENABLE_TRANSLATION_CACHE ? this.getCachedTranslation(text) : null;
      if (cached) {
        translations.set(text, cached);
        continue;
      }

      console.log(`[LLMTranslator] Translating ${index}/${strings.size} (${text.length} chars)`);
      const translated = await this.translateWholeString(text);
      translations.set(text, translated);

      if (ENABLE_TRANSLATION_CACHE) this.addToCache(text, translated);
    }

    if (ENABLE_TRANSLATION_CACHE) {
      await this.saveCache();
    }

    if (toTranslate.length > 0) {
      const newTranslations = await this.translateBatch(toTranslate);

      toTranslate.forEach((str, idx) => {
        const translated = newTranslations[idx] || str;
        translations.set(str, translated);
        if (ENABLE_TRANSLATION_CACHE) this.addToCache(str, translated);
      });

      if (ENABLE_TRANSLATION_CACHE) {
        await this.saveCache();
      }
    }

    if (ENABLE_TRANSLATION_CACHE) await this.saveCache();

    return this.reconstructJson(dashboard, translations);
  }

  private extractTranslatableStrings(obj: any): Set<string> {
    const out = new Set<string>();

    const traverse = (current: any, pathParts: string[] = []) => {
      if (typeof current === 'string') {
        const fieldName = pathParts[pathParts.length - 1] || '';
        if (this.shouldTranslate(fieldName, current) && !seen.has(current)) {
          strings.set(current, '');
          seen.add(current);
        }
        return;
      }

      if (Array.isArray(current)) {
        current.forEach((item, idx) => traverse(item, [...pathParts, idx.toString()]));
        return;
      }

      if (current && typeof current === 'object') {
        Object.entries(current).forEach(([key, value]) => traverse(value, [...pathParts, key]));
      }
    };

    walk(obj);
    return out;
  }

  private shouldTranslate(fieldName: string, value: string): boolean {
    if (NON_TRANSLATABLE_FIELDS.has(fieldName)) return false;

    if (TRANSLATABLE_FIELDS.has(fieldName)) {
      return !this.isTechnicalValue(value);
    }

    if (this.isTechnicalValue(value)) return false;

    const wordCount = value.split(/\s+/).filter(Boolean).length;
    if (wordCount <= 2 && value.length < 20) return false;

    if (!/[a-zA-Z]/.test(value)) return false;

    return true;
  }

  private isTechnicalValue(value: string): boolean {
    return TECHNICAL_PATTERNS.some(pattern => pattern.test(value));
  }

  private async translateBatch(strings: string[]): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < strings.length; i += BATCH_SIZE) {
      const batch = strings.slice(i, i + BATCH_SIZE);
      for (let j = 0; j < batch.length; j++) {
        const text = batch[j];
        console.log(`[LLMTranslator] Translating ${i + j + 1}/${strings.length} (${text.length} chars)`);
        try {
          const translated = await this.callTranslator(text);
          results.push(translated);
        } catch {
          results.push(text);
        }
      }
    }

    return results;
  }

  private buildTranslationPrompt(text: string): string {
    // Official gemma3-translator format from model docs.
    return `Translate from English to Spanish: ${text}`;
  }

  private async callTranslator(text: string, attempt: number = 1): Promise<string> {
    const prompt = this.buildTranslationPrompt(text);
    const timeoutMs = Math.min(30000 + (text.length * 30), 300000);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
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
            num_predict: Math.min(text.length * 2, 4000),
            top_p: 0.95,
          },
        }),
      });

      if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);

      const data = await response.json() as { response?: string };
      return (data.response || '').trim();
    } catch (error) {
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
        return this.callTranslator(text, attempt + 1);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private reconstructJson(original: any, translations: Map<string, string>): any {
    const result = JSON.parse(JSON.stringify(original));

    const traverseAndReplace = (current: any, pathParts: string[] = []) => {
      if (typeof current === 'string') {
        const translated = translations.get(current);
        if (translated) this.setValueAtPath(result, pathParts, translated);
        return;
      }
      if (Array.isArray(current)) {
        current.forEach((item, idx) => traverseAndReplace(item, [...pathParts, idx.toString()]));
        return;
      }
      if (current && typeof current === 'object') {
        Object.entries(current).forEach(([key, value]) => traverseAndReplace(value, [...pathParts, key]));
      }
    };

    walk(original);
    return result;
  }

  private setValueAtPath(obj: any, pathParts: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const key = pathParts[i];
      if (!(key in current)) return;
      current = current[key];
    }
    const last = pathParts[pathParts.length - 1];
    if (cur && typeof cur === 'object') cur[last] = value;
  }

    const lastKey = pathParts[pathParts.length - 1];
    if (current && typeof current === 'object') current[lastKey] = value;
  }

  private hashText(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  private getCachedTranslation(text: string): string | null {
    const hash = this.hashText(text);
    const entry = this.cache.get(hash);
    return entry?.translated || null;
  }

  private addToCache(original: string, translated: string): void {
    const hash = this.hashText(original);
    this.cache.set(hash, {
      original,
      translated,
      timestamp: new Date().toISOString(),
      model: TRANSLATION_MODEL,
    });
  }

  private async loadCache(): Promise<void> {
    try {
      const raw = await fs.readFile(this.cacheFile, 'utf-8');
      const parsed: TranslationCache = JSON.parse(raw);
      const now = Date.now();
      const ttlMs = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

      Object.entries(parsed).forEach(([hash, entry]) => {
        const ts = new Date(entry.timestamp).getTime();
        if (Number.isFinite(ts) && (now - ts) < ttlMs) this.cache.set(hash, entry);
      });

      console.log(`[LLMTranslator] Loaded ${this.cache.size} cached translations`);
    } catch {
      this.cache = new Map();
      console.log('[LLMTranslator] No translation cache found, starting fresh');
    }
  }

  private async saveCache(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.cacheFile), { recursive: true });
      const data: TranslationCache = Object.fromEntries(this.cache.entries());
      await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2));
      console.log(`[LLMTranslator] Saved ${this.cache.size} translations to cache`);
    } catch {
      // non-fatal
    }
  }
}

export default LLMTranslator;
