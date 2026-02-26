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
const TRANSLATION_PROVIDER = 'anylang';
const QUALITY_MIN_RATIO = parseFloat(process.env.TRANSLATION_MIN_LENGTH_RATIO || '0.55');
const QUALITY_MAX_RATIO = parseFloat(process.env.TRANSLATION_MAX_LENGTH_RATIO || '2.2');
const ENABLE_LANGUAGE_TOOL = process.env.ENABLE_LANGUAGE_TOOL !== 'false';
const LANGUAGETOOL_URL = process.env.LANGUAGETOOL_URL || 'https://api.languagetool.org/v2/check';

const TRANSLATABLE_FIELDS = new Set([
  'headline', 'summary', 'keyFindings', 'recommendedActions', 'title', 'themes',
  'excerpt', 'threatLandscape', 'analystBrief', 'technicalAssessment', 'keywords',
  'methodologies', 'narrative', 'explanation', 'rationale', 'reasoning',
]);

const NON_TRANSLATABLE_FIELDS = new Set([
  'id', 'version', 'generatedAt', 'validUntil', 'timestamp', 'lastUpdate', 'lastSeen', 'firstSeen',
  'cves', 'domains', 'ips', 'country', 'port', 'count', 'percentage', 'killChainPhase', 'service',
  'model', 'correlationStrength', 'riskLevel', 'trend', 'tone', 'severity', 'category',
  'confidenceLevel', 'url', 'author', 'displayName', 'username', 'name', 'org', 'asn', 'isp',
  'city', 'os', 'product', 'type', 'classification', 'urgency', 'confidence', 'ip', 'tweetId',
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

  constructor() {
    this.cache = new Map();
    this.cacheFile = path.join(
      process.env.CTI_CACHE_DIR || './DATA/cti-cache',
      'translation-cache.json'
    );
  }

  async translateDashboard(dashboard: any): Promise<any> {
    console.log('[LLMTranslator] Starting translation process with anylang...');

    await this.loadCache();

    const stringsMap = this.extractTranslatableStrings(dashboard);
    console.log(`[LLMTranslator] Found ${stringsMap.size} unique strings to translate`);

    if (stringsMap.size === 0) return dashboard;

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

    if (toTranslate.length > 0) {
      const newTranslations = await this.translateBatch(toTranslate);
      toTranslate.forEach((str, idx) => {
        const translated = newTranslations[idx] || str;
        translations.set(str, translated);
        this.addToCache(str, translated);
      });
      await this.saveCache();
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
    if (!value || value.trim().length < 3) return false;

    if (NON_TRANSLATABLE_FIELDS.has(fieldName)) return false;

    for (const pattern of TECHNICAL_PATTERNS) {
      if (pattern.test(value.trim())) return false;
    }

    if (TRANSLATABLE_FIELDS.has(fieldName)) return true;

    return value.split(/\s+/).length >= 3;
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
    const primary = await this.translateWithAnylang(text);
    const primaryChecked = await this.postProcessSpanish(primary);

    if (this.isAcceptableTranslation(text, primaryChecked)) {
      return primaryChecked;
    }

    console.warn('[LLMTranslator] Primary translation quality below threshold, retrying with fallback');
    const fallback = await this.translateWithLibreFallback(text);
    const fallbackChecked = await this.postProcessSpanish(fallback);

    if (this.isAcceptableTranslation(text, fallbackChecked)) {
      return fallbackChecked;
    }

    return primaryChecked || text;
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

    return true;
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
