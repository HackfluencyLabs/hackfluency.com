/**
 * CTI Translator - Simplified deterministic flow
 *
 * Design goals:
 * - Translate each eligible string as a whole unit (no chunk splitting)
 * - Use Ollama translator as primary provider
 * - Minimal fallback (HTTP adapter) only on failure/timeout
 * - Preserve frontend enums/raw paths and technical tokens
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import * as anylangAdapter from './anylang-adapter.js';

const TARGET_LANGUAGE = process.env.TARGET_LANGUAGE || 'es';
const SOURCE_LANGUAGE = process.env.SOURCE_LANGUAGE || 'en';
const ENABLE_TRANSLATION_CACHE = process.env.TRANSLATION_CACHE_ENABLED === 'true';
const CACHE_TTL_DAYS = parseInt(process.env.TRANSLATION_CACHE_TTL || '7', 10);

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL_TRANSLATOR = process.env.OLLAMA_MODEL_TRANSLATOR || 'zongwei/gemma3-translator:1b';
const OLLAMA_TRANSLATION_RETRIES = parseInt(process.env.OLLAMA_TRANSLATION_RETRIES || '2', 10);
const OLLAMA_TIMEOUT_SHORT_MS = parseInt(process.env.OLLAMA_TRANSLATION_TIMEOUT_SHORT_MS || '25000', 10);
const OLLAMA_TIMEOUT_LONG_MS = parseInt(process.env.OLLAMA_TRANSLATION_TIMEOUT_LONG_MS || '60000', 10);

const NON_TRANSLATABLE_FIELDS = new Set([
  'id', 'version', 'generatedAt', 'validUntil', 'timestamp', 'lastUpdate', 'lastSeen', 'firstSeen',
  'cves', 'domains', 'ips', 'url', 'ip', 'tweetId',
  'hashtags', 'mentions', 'source', 'permalink',
  // frontend semantic enums / keys
  'riskLevel', 'trend', 'trendDirection', 'severity', 'status', 'type', 'confidenceLevel',
  'killChainPhase', 'correlationStrength', 'model', 'quantization',
]);

const NON_TRANSLATABLE_PATH_PREFIXES = [
  'modelMetadata',
  'signalLayer.raw',
];

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

const PROTECTED_TERMS = [
  'Shodan', 'X.com', 'LATAM', 'Apache httpd', 'SIEM', 'CERT.br', 'CSIRT-MX'
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
  private cache = new Map<string, CacheEntry>();
  private cacheFile = path.join(process.env.CTI_CACHE_DIR || './DATA/cti-cache', 'translation-cache.json');

  async translateDashboard(dashboard: any): Promise<any> {
    console.log(`[LLMTranslator] Simplified mode: model=${OLLAMA_MODEL_TRANSLATOR}`);

    if (ENABLE_TRANSLATION_CACHE) await this.loadCache();

    const strings = this.extractTranslatableStrings(dashboard);
    console.log(`[LLMTranslator] Strings to translate: ${strings.size}`);

    const translations = new Map<string, string>();

    for (const text of strings) {
      const cached = ENABLE_TRANSLATION_CACHE ? this.getCachedTranslation(text) : null;
      if (cached) {
        translations.set(text, cached);
        continue;
      }

      const translated = await this.translateWholeString(text);
      translations.set(text, translated);

      if (ENABLE_TRANSLATION_CACHE) this.addToCache(text, translated);
    }

    if (ENABLE_TRANSLATION_CACHE) await this.saveCache();

    return this.reconstructJson(dashboard, translations);
  }

  private extractTranslatableStrings(obj: any): Set<string> {
    const out = new Set<string>();

    const walk = (current: any, pathParts: string[] = []) => {
      if (typeof current === 'string') {
        const fieldName = pathParts[pathParts.length - 1] || '';
        const pathKey = pathParts.join('.');
        if (this.shouldTranslate(fieldName, current, pathKey)) out.add(current);
        return;
      }

      if (Array.isArray(current)) {
        current.forEach((item, i) => walk(item, [...pathParts, String(i)]));
        return;
      }

      if (current && typeof current === 'object') {
        Object.entries(current).forEach(([k, v]) => walk(v, [...pathParts, k]));
      }
    };

    walk(obj);
    return out;
  }

  private shouldTranslate(fieldName: string, value: string, pathKey: string): boolean {
    if (!value || value.trim().length < 1) return false;
    if (NON_TRANSLATABLE_FIELDS.has(fieldName)) return false;
    if (NON_TRANSLATABLE_PATH_PREFIXES.some(prefix => pathKey.startsWith(prefix))) return false;
    for (const pattern of TECHNICAL_PATTERNS) if (pattern.test(value.trim())) return false;
    return true;
  }

  private protectTechnicalSegments(text: string): { prepared: string; placeholders: Map<string, string> } {
    const placeholders = new Map<string, string>();
    let prepared = text;
    let idx = 0;
    const protectedTermsPattern = PROTECTED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const segmentPattern = new RegExp(`(CVE-\\d{4}-\\d+|https?:\\/\\/\\S+|\\b(?:[a-z0-9._-]+):\\d+\\b|${protectedTermsPattern})`, 'gi');

    prepared = prepared.replace(segmentPattern, (m) => {
      const key = `__HFSEG_${idx++}__`;
      placeholders.set(key, m);
      return key;
    });

    return { prepared, placeholders };
  }

  private restoreTechnicalSegments(text: string, placeholders: Map<string, string>): string {
    let out = text;
    for (const [k, v] of placeholders) {
      const safe = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp(safe, 'g'), v);
    }
    return out;
  }

  private async translateWholeString(original: string): Promise<string> {
    const { prepared, placeholders } = this.protectTechnicalSegments(original);

    const viaOllama = await this.translateViaOllama(prepared);
    if (viaOllama) return this.restoreTechnicalSegments(viaOllama, placeholders);

    const viaHttp = await this.translateViaAdapter(prepared);
    if (viaHttp) return this.restoreTechnicalSegments(viaHttp, placeholders);

    return original;
  }

  private async translateViaOllama(text: string): Promise<string | null> {
    const timeoutMs = text.length > 600 ? OLLAMA_TIMEOUT_LONG_MS : OLLAMA_TIMEOUT_SHORT_MS;
    const prompt = [
      'Translate from English to professional Spanish.',
      'Return only translated Spanish text.',
      'Keep CVEs, URLs, IPs, ports and product names unchanged.',
      '',
      text,
    ].join('\n');

    for (let attempt = 0; attempt <= OLLAMA_TRANSLATION_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: OLLAMA_MODEL_TRANSLATOR,
            prompt,
            stream: false,
            options: { temperature: 0.1, top_p: 0.9, num_predict: text.length > 900 ? 2200 : 1200 }
          })
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json() as { response?: string };
        const translated = (payload.response || '').trim();
        if (translated) return translated;
      } catch {
        // continue to retry/fallback
      } finally {
        clearTimeout(timeout);
      }
    }

    return null;
  }

  private async translateViaAdapter(text: string): Promise<string | null> {
    try {
      const data = await anylangAdapter.translate(text, { from: SOURCE_LANGUAGE, to: TARGET_LANGUAGE }) as { translatedText?: string };
      return (data.translatedText || '').trim() || null;
    } catch {
      return null;
    }
  }

  private reconstructJson(original: any, translations: Map<string, string>): any {
    const result = JSON.parse(JSON.stringify(original));

    const walk = (current: any, pathParts: string[] = []) => {
      if (typeof current === 'string') {
        const translated = translations.get(current);
        if (translated) this.setValueAtPath(result, pathParts, translated);
        return;
      }
      if (Array.isArray(current)) {
        current.forEach((item, i) => walk(item, [...pathParts, String(i)]));
        return;
      }
      if (current && typeof current === 'object') {
        Object.entries(current).forEach(([k, v]) => walk(v, [...pathParts, k]));
      }
    };

    walk(original);
    return result;
  }

  private setValueAtPath(obj: any, pathParts: string[], value: any): void {
    let cur = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const k = pathParts[i];
      if (!(k in cur)) return;
      cur = cur[k];
    }
    const last = pathParts[pathParts.length - 1];
    if (cur && typeof cur === 'object') cur[last] = value;
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
      model: OLLAMA_MODEL_TRANSLATOR,
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
    } catch {
      this.cache = new Map();
    }
  }

  private async saveCache(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.cacheFile), { recursive: true });
      const serializable: TranslationCache = Object.fromEntries(this.cache.entries());
      await fs.writeFile(this.cacheFile, JSON.stringify(serializable, null, 2));
    } catch {
      // non-fatal
    }
  }
}

export default LLMTranslator;
