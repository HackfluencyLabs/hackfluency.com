/**
 * Translator - Sistema de traducción de dashboard CTI sin TranslateGemma.
 *
 * Arquitectura:
 * 1) Extrae strings traducibles del JSON (filtrando campos técnicos)
 * 2) Traduce con `anylang` como módulo principal del flujo (siempre disponible vía adapter interno)
 * 3) Fallback HTTP a LibreTranslate-compatible endpoint
 * 4) Cache persistente para evitar re-traducciones
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as anylangAdapter from './anylang-adapter.js';

const TARGET_LANGUAGE = process.env.TARGET_LANGUAGE || 'es';
const SOURCE_LANGUAGE = process.env.SOURCE_LANGUAGE || 'en';
const BATCH_SIZE = parseInt(process.env.TRANSLATION_BATCH_SIZE || '8', 10);
const CACHE_TTL_DAYS = parseInt(process.env.TRANSLATION_CACHE_TTL || '7', 10);
const ENABLE_TRANSLATION_CACHE = process.env.TRANSLATION_CACHE_ENABLED === 'true';
const TRANSLATION_PROVIDER = 'hybrid-translation';
const QUALITY_MIN_RATIO = parseFloat(process.env.TRANSLATION_MIN_LENGTH_RATIO || '0.55');
const QUALITY_MAX_RATIO = parseFloat(process.env.TRANSLATION_MAX_LENGTH_RATIO || '2.2');
const ENABLE_LANGUAGE_TOOL = process.env.ENABLE_LANGUAGE_TOOL !== 'false';
const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check';
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const PRIMARY_OLLAMA_TRANSLATOR_MODEL = process.env.OLLAMA_MODEL_TRANSLATOR || 'zongwei/gemma3-translator:1b';
const TRANSLATION_REWRITE_MODEL = process.env.OLLAMA_MODEL_TRANSLATION_REWRITE || process.env.OLLAMA_MODEL_REASONER || 'phi4-mini';
const ENABLE_OLLAMA_PRIMARY_TRANSLATION = process.env.ENABLE_OLLAMA_PRIMARY_TRANSLATION !== 'false';
const ENABLE_LLM_REWRITE = process.env.ENABLE_LLM_TRANSLATION_REWRITE === 'true';
const OLLAMA_TRANSLATION_TIMEOUT_MS = parseInt(process.env.OLLAMA_TRANSLATION_TIMEOUT_MS || '120000', 10);
const OLLAMA_TRANSLATION_RETRIES = parseInt(process.env.OLLAMA_TRANSLATION_RETRIES || '3', 10);
const OLLAMA_TRANSLATION_BUDGET_MS = parseInt(process.env.OLLAMA_TRANSLATION_BUDGET_MS || '480000', 10);
const OLLAMA_REWRITE_BUDGET_MS = parseInt(process.env.OLLAMA_REWRITE_BUDGET_MS || '240000', 10);

const NON_TRANSLATABLE_FIELDS = new Set([
  'id', 'version', 'generatedAt', 'validUntil', 'timestamp', 'lastUpdate', 'lastSeen', 'firstSeen',
  'cves', 'domains', 'ips', 'url', 'ip', 'tweetId',
  'hashtags', 'mentions', 'source', 'permalink',
]);

const TECHNICAL_PATTERNS = [
  /^CVE-\d{4}-\d+/i,
  /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  /^(http|https):\/\//,
  /^\d{4}-\d{2}-\d{2}T/,
  /^[A-Z]{2}$/,
  /^\d+:\d+$/,
  /^[a-f0-9]{32,64}$/i,
  /^v?\d+\.\d+/,
  /^@\w+/,
  /^#\w+/,
];

const ENGLISH_STOPWORDS = new Set([
  'the', 'and', 'with', 'from', 'that', 'this', 'these', 'those', 'while', 'there', 'which', 'are', 'is', 'was', 'were', 'have', 'has', 'had', 'for', 'into', 'about', 'over', 'under', 'without', 'between', 'within', 'across', 'through', 'ongoing', 'findings', 'analysis', 'recommended', 'actions',
]);

const PROTECTED_BRAND_TERMS = [
  'Shodan',
  'X.com',
  'LATAM',
  'Apache httpd',
  'SIEM',
  'CERT.br',
  'CSIRT-MX',
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

type AnylangModule = { translate: (...args: any[]) => Promise<any> };

export class LLMTranslator {
  private cache: Map<string, CacheEntry>;
  private cacheFile: string;
  private anylangModule: AnylangModule | null = anylangAdapter as unknown as AnylangModule;
  private translationStartedAt: number;
  private ollamaPrimaryDisabled = false;

  constructor() {
    this.cache = new Map();
    this.translationStartedAt = Date.now();
    this.cacheFile = path.join(
      process.env.CTI_CACHE_DIR || './DATA/cti-cache',
      'translation-cache.json'
    );
  }

  async translateDashboard(dashboard: any): Promise<any> {
    this.translationStartedAt = Date.now();
    this.ollamaPrimaryDisabled = false;
    console.log(`[LLMTranslator] Starting translation process (${ENABLE_OLLAMA_PRIMARY_TRANSLATION ? `ollama:${PRIMARY_OLLAMA_TRANSLATOR_MODEL}` : 'anylang'})...`);

    if (ENABLE_TRANSLATION_CACHE) {
      await this.loadCache();
    }

    const stringsMap = this.extractTranslatableStrings(dashboard);
    console.log(`[LLMTranslator] Found ${stringsMap.size} unique strings to translate`);

    if (stringsMap.size === 0) return dashboard;

    const toTranslate: string[] = [];
    const translations = new Map<string, string>();

    for (const [original] of stringsMap) {
      const cached = ENABLE_TRANSLATION_CACHE ? this.getCachedTranslation(original) : null;
      if (cached) {
        translations.set(original, cached);
      } else {
        toTranslate.push(original);
      }
    }

    console.log(`[LLMTranslator] ${translations.size} from cache, ${toTranslate.length} to translate`);

    if (toTranslate.length > 0) {
      const newTranslations = await this.translateBatch(toTranslate);
      toTranslate.forEach((str, idx) => {
        const translated = newTranslations[idx] || str;
        translations.set(str, translated);
        if (ENABLE_TRANSLATION_CACHE) {
          this.addToCache(str, translated);
        }
      });
      if (ENABLE_TRANSLATION_CACHE) {
        await this.saveCache();
      }
    }

    return this.reconstructJson(dashboard, translations);
  }

  private extractTranslatableStrings(obj: any): Map<string, string> {
    const strings = new Map<string, string>();
    const seen = new Set<string>();

    const traverse = (current: any, currentPath: string[] = []) => {
      if (typeof current === 'string') {
        const fieldName = currentPath[currentPath.length - 1] || '';
        if (this.shouldTranslate(fieldName, current) && !seen.has(current)) {
          strings.set(current, '');
          seen.add(current);
        }
        return;
      }

      if (Array.isArray(current)) {
        current.forEach((item, idx) => traverse(item, [...currentPath, idx.toString()]));
        return;
      }

      if (current && typeof current === 'object') {
        Object.entries(current).forEach(([key, value]) => traverse(value, [...currentPath, key]));
      }
    };

    traverse(obj);
    return strings;
  }

  private shouldTranslate(fieldName: string, value: string): boolean {
    if (!value || value.trim().length < 1) return false;

    if (NON_TRANSLATABLE_FIELDS.has(fieldName)) return false;

    for (const pattern of TECHNICAL_PATTERNS) {
      if (pattern.test(value.trim())) return false;
    }

    return true;
  }

  private async translateBatch(texts: string[]): Promise<string[]> {
    const results: string[] = [];

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const translatedBatch = await Promise.all(
        batch.map(async (text, idx) => {
          try {
            const translated = await this.translateWithQuality(text);
            if (!translated || translated.trim().length === 0) return text;
            console.log(`[LLMTranslator] Translated ${i + idx + 1}/${texts.length}`);
            return translated;
          } catch (error) {
            console.error(`[LLMTranslator] Translation failed for string ${i + idx}:`, error);
            return text;
          }
        })
      );
      results.push(...translatedBatch);
    }

    return results;
  }

  private async translateWithQuality(text: string): Promise<string> {
    const severity = text.match(/^(LOW|MEDIUM|HIGH|CRITICAL)\s*:\s*(.+)$/i);
    if (severity) {
      const translatedBody = await this.translateWithQuality(severity[2]);
      const labelMap: Record<string, string> = {
        LOW: 'BAJO',
        MEDIUM: 'MEDIO',
        HIGH: 'ALTO',
        CRITICAL: 'CRÍTICO',
      };
      const normalized = labelMap[severity[1].toUpperCase()] || severity[1].toUpperCase();
      return `${normalized}: ${translatedBody}`.trim();
    }

    const { prepared, placeholders } = this.protectTechnicalSegments(text);

    const primary = await this.translateTextSmart(prepared);
    const primaryChecked = this.restoreTechnicalSegments(await this.postProcessSpanish(primary), placeholders);
    const primaryFinal = await this.rewriteSpanishWithLLM(primaryChecked, text);

    if (this.isAcceptableTranslation(text, primaryFinal)) {
      return primaryFinal;
    }

    console.warn('[LLMTranslator] Primary translation quality below threshold, retrying with fallback');
    const fallback = await this.translateWithLibreFallback(prepared);
    const fallbackChecked = this.restoreTechnicalSegments(await this.postProcessSpanish(fallback), placeholders);
    const fallbackFinal = await this.rewriteSpanishWithLLM(fallbackChecked, text);

    if (this.isAcceptableTranslation(text, fallbackFinal)) {
      return fallbackFinal;
    }

    return primaryFinal || text;
  }

  private isAcceptableTranslation(original: string, translated: string): boolean {
    const source = original.trim();
    const target = translated.trim();

    if (!target || target.length < 2) return false;

    const ratio = target.length / Math.max(source.length, 1);
    if (ratio < QUALITY_MIN_RATIO || ratio > QUALITY_MAX_RATIO) return false;

    if (source.toLowerCase() === target.toLowerCase() && source.split(/\s+/).length >= 4) {
      return false;
    }

    const englishRatio = this.getEnglishStopwordRatio(target);
    if (target.split(/\s+/).length >= 12 && englishRatio > 0.22) {
      return false;
    }

    return true;
  }

  private async translateTextSmart(text: string): Promise<string> {
    const translateOne = (input: string) => this.translatePrimary(input);

    if (text.length <= 280) {
      return translateOne(text);
    }

    const parts = this.splitLongText(text);
    const translatedParts = await Promise.all(parts.map(part => translateOne(part)));
    return translatedParts.join(' ').replace(/\s+/g, ' ').trim();
  }

  private splitLongText(text: string): string[] {
    const fragments = text
      .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
      .map(fragment => fragment.trim())
      .filter(Boolean);

    if (fragments.length <= 1) return [text];

    const merged: string[] = [];
    let current = '';

    for (const fragment of fragments) {
      if (!current) {
        current = fragment;
        continue;
      }

      if ((current.length + fragment.length + 1) <= 260) {
        current = `${current} ${fragment}`;
      } else {
        merged.push(current);
        current = fragment;
      }
    }

    if (current) merged.push(current);
    return merged;
  }

  private protectTechnicalSegments(text: string): { prepared: string; placeholders: Map<string, string> } {
    const placeholders = new Map<string, string>();
    let prepared = text;
    let index = 0;
    const protectedTermsPattern = PROTECTED_BRAND_TERMS
      .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');
    const segmentPattern = new RegExp(`(CVE-\\d{4}-\\d+|https?:\\/\\/\\S+|\\b(?:[a-z0-9._-]+):\\d+\\b|${protectedTermsPattern})`, 'gi');

    prepared = prepared.replace(segmentPattern, (match) => {
      const key = `__HFSEGMENT_${index++}__`;
      placeholders.set(key, match);
      return key;
    });

    return { prepared, placeholders };
  }

  private restoreTechnicalSegments(text: string, placeholders: Map<string, string>): string {
    let restored = text;
    for (const [key, value] of placeholders.entries()) {
      const safe = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      restored = restored.replace(new RegExp(safe, 'g'), value);
    }
    return restored;
  }

  private getEnglishStopwordRatio(text: string): number {
    const words = (text.toLowerCase().match(/[a-záéíóúñü]+/g) || []).map(w => w.trim());
    if (words.length === 0) return 0;
    const englishHits = words.filter(word => ENGLISH_STOPWORDS.has(word)).length;
    return englishHits / words.length;
  }


  private async rewriteSpanishWithLLM(candidate: string, original: string): Promise<string> {
    if (!ENABLE_LLM_REWRITE || !candidate || candidate.trim().length < 40) {
      return candidate;
    }

    if (this.elapsedMs() > OLLAMA_REWRITE_BUDGET_MS) {
      return candidate;
    }

    try {
      const prompt = [
        'You are an expert English-to-Spanish cybersecurity translator.',
        'Rewrite the Spanish text for fluency and correctness while preserving technical meaning.',
        'STRICT RULES:',
        '- Keep ALL CVE IDs, URLs, ports, IPs and product names exactly unchanged.',
        '- Keep company/product brands unchanged: Shodan, X.com, LATAM, Apache httpd, SIEM, CERT.br, CSIRT-MX.',
        '- Return only the corrected Spanish text, no explanations.',
        '',
        `Original English: ${original}`,
        `Current Spanish: ${candidate}`,
      ].join('\n');

      const rewritten = await this.callOllamaRewrite(prompt);
      const cleaned = this.postRewriteCleanup((rewritten || '').trim());
      if (!cleaned) return candidate;
      if (!this.isAcceptableTranslation(original, cleaned)) return candidate;
      return cleaned;
    } catch {
      return candidate;
    }
  }

  private postRewriteCleanup(text: string): string {
    let out = text.replace(/^```(?:text)?\s*/i, '').replace(/```$/i, '').trim();
    for (const term of PROTECTED_BRAND_TERMS) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      out = out.replace(regex, term);
    }
    return out;
  }

  private async callOllamaRewrite(prompt: string): Promise<string> {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: TRANSLATION_REWRITE_MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.1, num_predict: 900, top_p: 0.9 }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const payload = await response.json() as { response?: string };
    return (payload.response || '').trim();
  }

  private async postProcessSpanish(text: string): Promise<string> {
    const normalized = text
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;!?])/g, '$1')
      .replace(/\(\s+/g, '(')
      .replace(/\s+\)/g, ')')
      .trim();

    if (!ENABLE_LANGUAGE_TOOL || !normalized) {
      return normalized;
    }

    try {
      const params = new URLSearchParams();
      params.set('language', 'es');
      params.set('text', normalized);

      const response = await fetch(LANGUAGETOOL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!response.ok) return normalized;

      const data = await response.json() as {
        matches?: Array<{
          offset: number;
          length: number;
          replacements?: Array<{ value: string }>;
        }>;
      };

      const matches = (data.matches || [])
        .filter(match => match.replacements && match.replacements.length > 0)
        .sort((a, b) => b.offset - a.offset);

      let corrected = normalized;
      for (const match of matches) {
        const replacement = match.replacements?.[0]?.value;
        if (!replacement) continue;
        corrected = corrected.slice(0, match.offset) + replacement + corrected.slice(match.offset + match.length);
      }

      return corrected.trim();
    } catch {
      return normalized;
    }
  }

  private async getAnylangModule(): Promise<AnylangModule | null> {
    return this.anylangModule;
  }

  private elapsedMs(): number {
    return Date.now() - this.translationStartedAt;
  }

  private shouldUsePrimaryOllama(): boolean {
    if (!ENABLE_OLLAMA_PRIMARY_TRANSLATION) return false;
    if (this.ollamaPrimaryDisabled) return false;
    if (this.elapsedMs() > OLLAMA_TRANSLATION_BUDGET_MS) {
      this.ollamaPrimaryDisabled = true;
      console.warn('[LLMTranslator] Ollama primary translation budget exhausted, switching to fallback provider');
      return false;
    }
    return true;
  }

  private async translatePrimary(text: string): Promise<string> {
    if (this.shouldUsePrimaryOllama()) {
      const viaOllama = await this.translateWithOllamaTranslator(text);
      if (viaOllama && viaOllama.trim().length > 0) {
        return viaOllama;
      }
    }

    return this.translateWithAnylang(text);
  }

  private async translateWithOllamaTranslator(text: string): Promise<string> {
    const prompt = [
      'Translate from English to neutral professional Spanish for cybersecurity CTI dashboards.',
      'Rules:',
      '- Preserve CVE IDs, URLs, IPs, domains, hashes and port notations exactly as-is.',
      '- Keep product/brand names unchanged (Shodan, X.com, LATAM, Apache httpd, SIEM, CERT.br, CSIRT-MX).',
      '- Return ONLY translated Spanish text.',
      '',
      text,
    ].join('\n');

    for (let attempt = 0; attempt <= OLLAMA_TRANSLATION_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OLLAMA_TRANSLATION_TIMEOUT_MS);
      try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: PRIMARY_OLLAMA_TRANSLATOR_MODEL,
            prompt,
            stream: false,
            options: { temperature: 0.1, num_predict: 1200, top_p: 0.9 }
          })
        });

        if (!response.ok) {
          throw new Error(`Ollama HTTP ${response.status}`);
        }

        const payload = await response.json() as { response?: string };
        const candidate = this.postRewriteCleanup((payload.response || '').trim());
        if (candidate) return candidate;
      } catch {
        if (attempt >= OLLAMA_TRANSLATION_RETRIES) {
          this.ollamaPrimaryDisabled = true;
          return text;
        }
        await this.sleep(2000 * (attempt + 1));
      } finally {
        clearTimeout(timeout);
      }
    }

    return text;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractTranslation(value: any): string | null {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return null;

    const candidates = [value.translation, value.translatedText, value.text, value.result];
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }

    return null;
  }

  private async translateWithAnylang(text: string): Promise<string> {
    const module = await this.getAnylangModule();

    if (module) {
      const fns: Array<((...args: any[]) => Promise<any>) | undefined> = [
        module.translate,
      ];

      for (const fn of fns) {
        if (!fn) continue;
        try {
          const byOptions = await fn(text, { from: SOURCE_LANGUAGE, to: TARGET_LANGUAGE });
          const translated = this.extractTranslation(byOptions);
          if (translated) return translated.trim();
        } catch {
          // try next signature
        }

        try {
          const byPositional = await fn(text, SOURCE_LANGUAGE, TARGET_LANGUAGE);
          const translated = this.extractTranslation(byPositional);
          if (translated) return translated.trim();
        } catch {
          // try next implementation
        }
      }
    }

    return this.translateWithLibreFallback(text);
  }

  private async translateWithLibreFallback(text: string): Promise<string> {
    try {
      const data = await anylangAdapter.translate(text, { from: SOURCE_LANGUAGE, to: TARGET_LANGUAGE }) as { translatedText?: string };
      return (data.translatedText || text).trim();
    } catch {
      return text;
    }
  }

  private reconstructJson(original: any, translations: Map<string, string>): any {
    const result = JSON.parse(JSON.stringify(original));

    const traverseAndReplace = (current: any, currentPath: string[] = []) => {
      if (typeof current === 'string') {
        const translated = translations.get(current);
        if (translated) this.setValueAtPath(result, currentPath, translated);
        return;
      }

      if (Array.isArray(current)) {
        current.forEach((item, idx) => traverseAndReplace(item, [...currentPath, idx.toString()]));
        return;
      }

      if (current && typeof current === 'object') {
        Object.entries(current).forEach(([key, value]) => traverseAndReplace(value, [...currentPath, key]));
      }
    };

    traverseAndReplace(original);
    return result;
  }

  private setValueAtPath(obj: any, currentPath: string[], value: any): void {
    let current = obj;
    for (let i = 0; i < currentPath.length - 1; i++) {
      const key = currentPath[i];
      if (!(key in current)) return;
      current = current[key];
    }

    const lastKey = currentPath[currentPath.length - 1];
    if (current && typeof current === 'object') current[lastKey] = value;
  }

  private async loadCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      const parsed: TranslationCache = JSON.parse(data);
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
      this.cache = new Map();
      console.log('[LLMTranslator] No translation cache found, starting fresh');
    }
  }

  private async saveCache(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.cacheFile), { recursive: true });
      const data: TranslationCache = Object.fromEntries(this.cache);
      await fs.writeFile(this.cacheFile, JSON.stringify(data, null, 2));
      console.log(`[LLMTranslator] Saved ${this.cache.size} translations to cache`);
    } catch (error) {
      console.error('[LLMTranslator] Failed to save cache:', error);
    }
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
      model: TRANSLATION_PROVIDER,
    });
  }

  private hashText(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }
}

export default LLMTranslator;
