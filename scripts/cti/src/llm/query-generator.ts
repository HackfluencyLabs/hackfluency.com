/**
 * LLM Query Generator - Genera queries de Shodan basado en intel de X.com
 * 
 * Arquitectura Dual-Model:
 * - Este módulo usa OLLAMA_MODEL_SPECIALIST (Qwen Cybersecurity)
 * - Especializado en: queries Shodan, CVEs, puertos, servicios técnicos
 * 
 * Flujo: X.com social intel → LLM analysis → Dynamic Shodan queries
 * 
 * El LLM analiza:
 * - Menciones de CVEs específicos
 * - Campañas de ransomware/malware activas
 * - Puertos/servicios mencionados en discusiones
 * - Países/regiones objetivo
 * - TTPs (Tactics, Techniques, Procedures) observados
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { XScrapedData, XPost } from '../types/index.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
// Specialist model for technical queries (CVE, ports, Shodan syntax)
const OLLAMA_MODEL_SPECIALIST = process.env.OLLAMA_MODEL_SPECIALIST;

export interface ShodanQuerySuggestion {
  query: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface QueryGeneratorResult {
  timestamp: string;
  model: string;
  sourcePostsAnalyzed: number;
  queries: ShodanQuerySuggestion[];
  extractedIndicators: {
    cves: string[];
    ports: number[];
    services: string[];
    countries: string[];
    malwareFamilies: string[];
    threatActors: string[];
  };
  rawAnalysis: string;
}

// Mapeo de servicios/malware a puertos Shodan
const SERVICE_TO_PORT: Record<string, string> = {
  'ssh': 'port:22',
  'rdp': 'port:3389',
  'smb': 'port:445',
  'ftp': 'port:21',
  'telnet': 'port:23',
  'mysql': 'port:3306',
  'postgres': 'port:5432',
  'redis': 'port:6379',
  'mongodb': 'port:27017',
  'elasticsearch': 'port:9200',
  'apache': 'product:apache',
  'nginx': 'product:nginx',
  'iis': 'product:iis',
  'exchange': 'product:exchange',
  'citrix': 'product:citrix',
  'fortinet': 'product:fortinet',
  'palo alto': 'product:"palo alto"',
  'cisco': 'product:cisco',
  'mikrotik': 'product:mikrotik',
  'kubernetes': 'port:6443',
  'docker': 'port:2375,2376',
  'jenkins': 'product:jenkins',
  'gitlab': 'product:gitlab',
  'confluence': 'product:confluence',
  'jira': 'product:jira'
};

// Mapeo de países mencionados a códigos Shodan
const COUNTRY_TO_CODE: Record<string, string> = {
  'united states': 'US',
  'usa': 'US',
  'us': 'US',
  'china': 'CN',
  'russia': 'RU',
  'iran': 'IR',
  'north korea': 'KP',
  'germany': 'DE',
  'uk': 'GB',
  'united kingdom': 'GB',
  'france': 'FR',
  'japan': 'JP',
  'india': 'IN',
  'brazil': 'BR',
  'mexico': 'MX',
  'spain': 'ES'
};

export class QueryGenerator {
  private outputDir: string;
  private cacheDir: string;

  constructor() {
    this.outputDir = process.env.CTI_OUTPUT_DIR || './DATA/cti-output';
    this.cacheDir = process.env.CTI_CACHE_DIR || './DATA/cti-cache';
  }

  /**
   * Verifica si hay cache válido (TTL de 24 horas)
   */
  private async loadFromCache(): Promise<QueryGeneratorResult | null> {
    try {
      const cachePath = path.join(this.cacheDir, 'query-generator-cache.json');
      await fs.access(cachePath);
      
      const raw = await fs.readFile(cachePath, 'utf-8');
      const cached = JSON.parse(raw) as QueryGeneratorResult;
      
      // Verificar si el cache es del mismo día
      const cacheDate = new Date(cached.timestamp).toDateString();
      const today = new Date().toDateString();
      
      if (cacheDate === today) {
        console.log('[QueryGen] Using cached queries from today');
        return cached;
      }
      
      console.log('[QueryGen] Cache expired (different day)');
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Guarda resultado en cache
   */
  private async saveToCache(result: QueryGeneratorResult): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      await fs.writeFile(
        path.join(this.cacheDir, 'query-generator-cache.json'),
        JSON.stringify(result, null, 2)
      );
      console.log('[QueryGen] Saved to cache');
    } catch (err) {
      console.log('[QueryGen] Failed to save cache:', err);
    }
  }

  /**
   * Genera queries de Shodan analizando datos de X.com con LLM Specialist
   * Uses cybersecurity-specialized model for technical query generation
   */
  async generateQueries(useCache: boolean = true): Promise<QueryGeneratorResult> {
    const modelName = OLLAMA_MODEL_SPECIALIST ?? 'unknown';
    console.log(`[QueryGen] Using SPECIALIST model: ${modelName}`);
    
    if (!OLLAMA_MODEL_SPECIALIST) {
      throw new Error('[QueryGen] OLLAMA_MODEL_SPECIALIST not set - cannot generate queries');
    }
    
    // Intentar usar cache primero
    if (useCache) {
      const cached = await this.loadFromCache();
      if (cached) return cached;
    }
    
    const xData = await this.loadXData();
    if (!xData || xData.posts.length === 0) {
      console.log('[QueryGen] No X.com data available - aborting query generation');
      throw new Error('[QueryGen] No social intel available to generate contextual queries');
    }

    // Extraer indicadores directamente del texto (rápido, sin LLM)
    const indicators = this.extractIndicatorsFromPosts(xData.posts);
    console.log(`[QueryGen] Extracted indicators:`);
    console.log(`  CVEs: ${indicators.cves.length}`);
    console.log(`  Ports: ${indicators.ports.length}`);
    console.log(`  Services: ${indicators.services.length}`);
    console.log(`  Malware: ${indicators.malwareFamilies.length}`);
    console.log(`  Actors: ${indicators.threatActors.length}`);
    
    // Construir prompt con contexto social
    const prompt = this.buildAnalysisPrompt(xData.posts, indicators);
    
    console.log(`[QueryGen] Analyzing ${xData.posts.length} posts with specialist model`);

    // Call LLM - throws on failure (no fallback)
    const rawAnalysis = await this.callOllama(prompt);
    const llmQueries = this.parseLLMResponse(rawAnalysis);
    
    if (llmQueries.length === 0) {
      console.error('[QueryGen] LLM returned no valid queries');
      console.error('[QueryGen] Raw response:', rawAnalysis.substring(0, 500));
      throw new Error('[QueryGen] Specialist model failed to generate valid queries');
    }
    
    console.log(`[QueryGen] LLM generated ${llmQueries.length} queries`);
    for (const q of llmQueries) {
      console.log(`  [${q.priority}] ${q.query}`);
    }

    const result: QueryGeneratorResult = {
      timestamp: new Date().toISOString(),
      model: modelName,
      sourcePostsAnalyzed: xData.posts.length,
      queries: llmQueries,
      extractedIndicators: indicators,
      rawAnalysis
    };

    await this.saveResult(result);
    await this.saveToCache(result);
    return result;
  }

  /**
   * Extrae indicadores directamente del texto de posts
   * Enhanced extraction for better context-aware queries
   */
  private extractIndicatorsFromPosts(posts: XPost[]): QueryGeneratorResult['extractedIndicators'] {
    const allText = posts.map(p => p.text.toLowerCase()).join(' ');
    
    // CVEs (pattern: CVE-YYYY-NNNNN) - also capture mentioned CVEs
    const cveMatches = allText.match(/cve-\d{4}-\d{4,}/gi) || [];
    const cves = [...new Set(cveMatches.map(c => c.toUpperCase()))];

    // Puertos mencionados explícitamente
    const portMatches = allText.match(/port[:\s]+(\d+)/gi) || [];
    const ports = [...new Set(portMatches.map(p => {
      const num = p.match(/\d+/)?.[0];
      return num ? parseInt(num) : 0;
    }).filter(p => p > 0 && p < 65536))];

    // Servicios/productos - expanded list
    const services = Object.keys(SERVICE_TO_PORT)
      .filter(service => allText.includes(service.toLowerCase()));

    // Países
    const countries = Object.keys(COUNTRY_TO_CODE)
      .filter(country => allText.includes(country.toLowerCase()))
      .map(c => COUNTRY_TO_CODE[c]);

    // Malware families - expanded list with modern ransomware
    const malwarePatterns = [
      'lockbit', 'blackcat', 'alphv', 'clop', 'royal', 'play', 'akira',
      'rhysida', 'medusa', 'bianlian', 'hive', 'conti', 'revil', 'sodinokibi',
      'emotet', 'qakbot', 'cobalt strike', 'trickbot', 'icedid', 'bumblebee',
      'dragonforce', 'reynolds', 'blackbasta', 'blacksuit', 'hunters',
      'cactus', 'trigona', '8base', 'noescape', 'qilin', 'phobos', 'mallox'
    ];
    const malwareFamilies = malwarePatterns.filter(m => allText.includes(m));

    // Threat actors - expanded with current APT groups
    const actorPatterns = [
      'lazarus', 'apt28', 'apt29', 'cozy bear', 'fancy bear', 'sandworm',
      'hafnium', 'nobelium', 'scattered spider', 'lapsus', 'fin7', 'fin8',
      'mustangpanda', 'unc6384', 'volt typhoon', 'charming kitten', 
      'turla', 'gamaredon', 'kimsuky', 'ta505', 'ta577', 'ta569',
      'unc3886', 'unc4841', 'midnight blizzard', 'star blizzard'
    ];
    const threatActors = actorPatterns.filter(a => allText.includes(a));

    return { cves, ports, services, countries, malwareFamilies, threatActors };
  }

  /**
   * Construye prompt para análisis de CTI
   */
  private buildAnalysisPrompt(posts: XPost[], indicators: QueryGeneratorResult['extractedIndicators']): string {
    // Resumir posts (máx 15 más relevantes por engagement)
    const sortedPosts = posts
      .sort((a, b) => (b.metrics.likes + b.metrics.reposts) - (a.metrics.likes + a.metrics.reposts))
      .slice(0, 15);

    const postSummaries = sortedPosts.map((p, i) => {
      const engagement = p.metrics.likes + p.metrics.reposts;
      return `[${i + 1}] @${p.author.username} (${engagement} engagement): ${p.text.slice(0, 200)}${p.text.length > 200 ? '...' : ''}`;
    }).join('\n\n');

    return `You are a CTI analyst. Analyze these recent security-related social media posts and suggest Shodan queries.

CONTEXT - Already Extracted Indicators:
- CVEs: ${indicators.cves.join(', ') || 'none'}
- Ports: ${indicators.ports.join(', ') || 'none'}
- Services: ${indicators.services.join(', ') || 'none'}
- Malware: ${indicators.malwareFamilies.join(', ') || 'none'}
- Threat Actors: ${indicators.threatActors.join(', ') || 'none'}

SOCIAL INTEL (Top 15 posts by engagement):
${postSummaries}

INSTRUCTIONS:
Based on the social intel above, suggest Shodan queries to find potentially exposed infrastructure.

SHODAN QUERY SYNTAX (free tier):
- port:22 (single port)
- port:22,3389,445 (multiple ports)
- country:US (single country)
- product:apache (product name)
- os:windows (operating system)
- Combine with spaces: port:22 country:US

IMPORTANT: Free tier cannot use vuln: filter. Focus on ports, products, and countries.
IMPORTANT: Do NOT suggest generic baseline scans like "port:22,3389,445" unless those services are explicitly supported by social evidence.
Every query must be traceable to at least one social indicator (CVE, actor, malware family, campaign, product, or discussed region).

RESPOND WITH JSON ARRAY:
[
  {
    "query": "shodan query string",
    "rationale": "why this query is relevant based on the social intel",
    "priority": "high|medium|low",
    "tags": ["relevant", "tags"]
  }
]

Only suggest 3-5 queries. Be specific and actionable.`;
  }

  /**
   * Llama a Ollama con el modelo SPECIALIST para queries técnicas
   */
  private async callOllama(prompt: string): Promise<string> {
    const startTime = Date.now();
    console.log(`[QueryGen] Calling specialist model: ${OLLAMA_MODEL_SPECIALIST}`);
    console.log(`[QueryGen] Prompt size: ${prompt.length} chars`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000); // 3 min timeout for thorough analysis

    try {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL_SPECIALIST,
          prompt,
          stream: false,
          options: {
            temperature: 0.2,      // Lower temp for precise technical queries
            num_predict: 1200,     // Longer response for detailed analysis
            top_p: 0.85,
            top_k: 30
          }
        })
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => 'no body');
        console.error(`[QueryGen] HTTP ${res.status}: ${errBody}`);
        throw new Error(`HTTP ${res.status}: ${errBody}`);
      }
      
      const json = await res.json() as { response: string };
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[QueryGen] ✓ Response: ${json.response.length} chars in ${elapsed}s`);
      return json.response;
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`[QueryGen] ✗ Failed after ${elapsed}s:`, err);
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parsea respuesta del LLM - sin filtros genéricos, confiamos en el modelo especialista
   */
  private parseLLMResponse(raw: string): ShodanQuerySuggestion[] {
    try {
      // Buscar array JSON en la respuesta
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('[QueryGen] No JSON array found in response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]) as ShodanQuerySuggestion[];
      
      // Validar estructura - confiamos en el LLM para queries contextualmente relevantes
      const valid = parsed.filter(q => 
        q.query && 
        typeof q.query === 'string' && 
        q.query.length > 3 &&
        !q.query.includes('vuln:') // Free tier no puede usar vuln:
      ).map(q => ({
        query: q.query.trim(),
        rationale: q.rationale || 'Specialist model suggested',
        priority: (['high', 'medium', 'low'].includes(q.priority) ? q.priority : 'medium') as 'high' | 'medium' | 'low',
        tags: Array.isArray(q.tags) ? q.tags : []
      }));
      
      // Limit to 5 queries (Shodan free tier rate limit)
      return valid.slice(0, 5);
    } catch (err) {
      console.error('[QueryGen] Failed to parse LLM JSON response:', err);
      return [];
    }
  }

  // No heuristic queries - trust the specialist LLM for contextual query generation
  // No generic pattern filtering - LLM is instructed to avoid generic scans

  private async loadXData(): Promise<XScrapedData | null> {
    try {
      const raw = await fs.readFile(
        path.join(this.outputDir, 'x-data.json'),
        'utf-8'
      );
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private async saveResult(result: QueryGeneratorResult): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(
      path.join(this.outputDir, 'shodan-queries.json'),
      JSON.stringify(result, null, 2)
    );
    console.log(`[QueryGen] Saved ${result.queries.length} queries to shodan-queries.json`);
  }

  // emptyResult removed - no fallback/default queries allowed
  // Pipeline must abort if no social intel or LLM fails
}

export default QueryGenerator;
