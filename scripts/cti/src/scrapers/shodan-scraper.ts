/**
 * Shodan Scraper - Obtiene datos de amenazas desde Shodan
 * Incluye validación completa de API key y capacidades disponibles
 * 
 * NO usa queries genéricas - requiere queries contextuales del QueryGenerator
 * basadas en social intel de X.com
 */

import { BaseScraper, registerScraper } from './base-scraper.js';
import {
  DataSource,
  ShodanScrapedData,
  ShodanHost,
  ShodanExploit,
  ScraperConfig
} from '../types/index.js';
import QueryPreprocessor from '../utils/query-preprocessor.js';

// NO hay queries fallback - siempre requiere contexto social
// El QueryGenerator debe proporcionar queries basadas en intel real

// Variable global para queries contextuales del QueryGenerator
let contextualQueries: string[] = [];

/**
 * Set contextual queries from QueryGenerator before running Shodan
 * This enables context-aware infrastructure discovery based on social intel
 */
export function setContextualQueries(queries: string[]): void {
  contextualQueries = queries;
  console.log(`[ShodanScraper] Set ${queries.length} contextual queries from social intel`);
}

interface ShodanAPIInfo {
  scan_credits: number;
  usage_limits: {
    scan_credits: number;
    query_credits: number;
    monitored_ips: number;
  };
  plan: string;
  https: boolean;
  unlocked: boolean;
  query_credits: number;
  monitored_ips: number | null;
  unlocked_left: number;
  telnet: boolean;
}

interface ShodanAPICapabilities {
  isValid: boolean;
  plan: 'free' | 'dev' | 'basic' | 'plus' | 'corp' | 'unknown';
  queryCredits: number;
  scanCredits: number;
  canUseVulnFilter: boolean;
  canUseExploitsAPI: boolean;
  canUseScanAPI: boolean;
  // No recommendedQuery - we only run contextual queries from LLM
  error?: string;
}

interface ShodanAPIHost {
  ip_str: string;
  port: number;
  hostnames?: string[];
  org?: string;
  asn?: string;
  isp?: string;
  location?: {
    country_code?: string;
    city?: string;
  };
  os?: string;
  product?: string;
  version?: string;
  vulns?: string[] | Record<string, unknown>; // Can be array or object
  tags?: string[];
  timestamp?: string;
}

interface ShodanAPISearchResult {
  matches: ShodanAPIHost[];
  total: number;
}

interface ShodanAPIExploit {
  _id: string;
  cve?: string[];
  description: string;
  platform?: string;
  type?: string;
  source: string;
}

interface ShodanAPIExploitsResult {
  matches: ShodanAPIExploit[];
  total: number;
}

export class ShodanScraper extends BaseScraper<ShodanScrapedData> {
  private apiKey: string;
  private baseUrl = 'https://api.shodan.io';
  private capabilities: ShodanAPICapabilities | null = null;

  constructor(config: ScraperConfig) {
    super(config);
    this.apiKey = process.env.SHODAN_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[ShodanScraper] No API key provided. Some features will be limited.');
    }
  }

  protected get scraperName(): string {
    return 'ShodanScraper';
  }

  /**
   * Valida la API key y determina las capacidades disponibles
   * No proporciona queries por defecto - requiere queries contextuales
   */
  private async validateAPIKey(): Promise<ShodanAPICapabilities> {
    if (!this.apiKey) {
      return {
        isValid: false,
        plan: 'unknown',
        queryCredits: 0,
        scanCredits: 0,
        canUseVulnFilter: false,
        canUseExploitsAPI: false,
        canUseScanAPI: false,
        error: 'No API key provided'
      };
    }

    try {
      const url = `${this.baseUrl}/api-info?key=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          return {
            isValid: false,
            plan: 'unknown',
            queryCredits: 0,
            scanCredits: 0,
            canUseVulnFilter: false,
            canUseExploitsAPI: false,
            canUseScanAPI: false,
            error: 'Invalid API key (401 Unauthorized)'
          };
        }
        throw new Error(`API info request failed: ${response.status}`);
      }

      const info = await response.json() as ShodanAPIInfo;
      
      // Determinar plan basado en créditos y características
      let plan: ShodanAPICapabilities['plan'] = 'free';
      let canUseVulnFilter = false;
      let canUseExploitsAPI = false;
      let canUseScanAPI = false;

      // Planes de pago tienen más de 0 scan credits o query credits > 100
      if (info.plan) {
        const planLower = info.plan.toLowerCase();
        if (planLower.includes('corp') || planLower.includes('enterprise')) {
          plan = 'corp';
          canUseVulnFilter = true;
          canUseExploitsAPI = true;
          canUseScanAPI = true;
        } else if (planLower.includes('plus') || planLower.includes('professional')) {
          plan = 'plus';
          canUseVulnFilter = true;
          canUseExploitsAPI = true;
          canUseScanAPI = info.scan_credits > 0;
        } else if (planLower.includes('basic') || planLower.includes('freelancer')) {
          plan = 'basic';
          canUseVulnFilter = true;
          canUseExploitsAPI = false;
          canUseScanAPI = info.scan_credits > 0;
        } else if (planLower.includes('dev') || planLower.includes('developer')) {
          plan = 'dev';
          canUseVulnFilter = false;
          canUseExploitsAPI = false;
          canUseScanAPI = false;
        }
      }

      // Verificar créditos disponibles
      if (info.query_credits <= 0 && plan !== 'corp') {
        canUseVulnFilter = false;
      }

      const capabilities: ShodanAPICapabilities = {
        isValid: true,
        plan,
        queryCredits: info.query_credits || 0,
        scanCredits: info.scan_credits || 0,
        canUseVulnFilter,
        canUseExploitsAPI,
        canUseScanAPI
      };

      console.log(`[ShodanScraper] API Validated - Plan: ${plan}, Query Credits: ${info.query_credits}, Vuln Filter: ${canUseVulnFilter}`);
      
      return capabilities;

    } catch (error) {
      console.error('[ShodanScraper] API validation failed:', error);
      return {
        isValid: false,
        plan: 'unknown',
        queryCredits: 0,
        scanCredits: 0,
        canUseVulnFilter: false,
        canUseExploitsAPI: false,
        canUseScanAPI: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  protected async scrape(): Promise<ShodanScrapedData> {
    // Validar API antes de cualquier operación
    console.log('[ShodanScraper] Validating API key and capabilities...');
    this.capabilities = await this.validateAPIKey();

    if (!this.capabilities.isValid) {
      console.warn(`[ShodanScraper] API validation failed: ${this.capabilities.error}`);
      console.log('[ShodanScraper] Returning empty dataset - no fake data');
      return this.getEmptyData();
    }

    if (contextualQueries.length === 0) {
      console.error('[ShodanScraper] No contextual queries provided');
      throw new Error('[ShodanScraper] Contextual queries required');
    }

    const hosts: ShodanHost[] = [];
    const exploits: ShodanExploit[] = [];
    
    const preprocessor = new QueryPreprocessor();
    const processedQueries = preprocessor.processQueries(
      contextualQueries, 
      this.capabilities.plan
    );
    
    console.log(`[ShodanScraper] Processing ${contextualQueries.length} queries, ${processedQueries.length} valid after optimization`);
    processedQueries.forEach((pq, i) => {
      console.log(`  [${i + 1}] ${pq.query} (${pq.estimatedResults} results expected)`);
      if (pq.optimizations.length > 0) {
        pq.optimizations.forEach(opt => console.log(`      → ${opt}`));
      }
    });

    const queriesToRun = processedQueries.slice(0, 3);

    for (const processedQuery of queriesToRun) {
      const query = processedQuery.query;
      try {
        console.log(`[ShodanScraper] Executing: ${query}`);
        const searchResults = await this.searchHosts(query);
        hosts.push(...searchResults);
        console.log(`[ShodanScraper] Query returned ${searchResults.length} hosts`);
        
        if (queriesToRun.length > 1 && queriesToRun.indexOf(processedQuery) < queriesToRun.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`[ShodanScraper] Query "${query}" failed:`, error);
      }
    }
    
    // If no hosts found from any query
    if (hosts.length === 0) {
      console.log('[ShodanScraper] No hosts found - returning empty dataset');
      return this.getEmptyData('No results from queries');
    }

    // Generar exploits desde CVEs encontrados (sin request adicional)
    const cveSet = new Set<string>();
    hosts.forEach(h => {
      if (h.vulns) {
        const vulnList = Array.isArray(h.vulns) ? h.vulns : Object.keys(h.vulns);
        vulnList.forEach(v => cveSet.add(v));
      }
    });
    
    const exploitList = Array.from(cveSet).slice(0, 10).map(cve => ({
      id: this.generateId('exp'),
      cve,
      description: `Vulnerability ${cve} detected in scan`,
      source: 'shodan-scan'
    }));
    exploits.push(...exploitList);

    const countryCounts = new Map<string, number>();
    hosts.forEach(h => {
      if (h.country && h.country !== 'Unknown') {
        countryCounts.set(h.country, (countryCounts.get(h.country) || 0) + 1);
      }
    });
    const topCountries = Array.from(countryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => `${code}:${count}`)
      .join(', ');
    
    console.log(`[ShodanScraper] Real data: ${hosts.length} hosts, ${exploits.length} CVEs found`);
    if (topCountries) {
      console.log(`[ShodanScraper] Top countries: ${topCountries}`);
    }

    return {
      source: DataSource.SHODAN,
      timestamp: new Date().toISOString(),
      rawData: { hosts, exploits, capabilities: this.capabilities },
      hosts: this.deduplicateHosts(hosts),
      exploits,
      query: queriesToRun.join(' | ')  // Join all executed queries
    };
  }

  /**
   * Retorna datos vacíos cuando la API no está disponible
   * No genera datos falsos - solo reporta el error
   */
  private getEmptyData(error?: string): ShodanScrapedData {
    return {
      source: DataSource.SHODAN,
      timestamp: new Date().toISOString(),
      rawData: { error: error || this.capabilities?.error || 'API unavailable', dataAvailable: false },
      hosts: [],
      exploits: [],
      query: 'none'
    };
  }

  /**
   * Busca hosts en Shodan
   */
  private async searchHosts(query: string): Promise<ShodanHost[]> {
    const url = `${this.baseUrl}/shodan/host/search?key=${this.apiKey}&query=${encodeURIComponent(query)}&limit=100`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid Shodan API key');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`Shodan API error: ${response.status}`);
    }

    const data = await response.json() as ShodanAPISearchResult;
    
    return data.matches.map((match): ShodanHost => {
      // Normalizar vulns: puede ser array o objeto {CVE: {...}}
      let vulnArray: string[] | undefined;
      if (match.vulns) {
        vulnArray = Array.isArray(match.vulns) ? match.vulns : Object.keys(match.vulns);
      }
      
      return {
        ip: match.ip_str,
        port: match.port,
        hostnames: match.hostnames || [],
        org: match.org,
        asn: match.asn,
        isp: match.isp,
        country: match.location?.country_code || 'Unknown',
        city: match.location?.city,
        os: match.os,
        product: match.product,
        version: match.version,
        vulns: vulnArray,
        tags: match.tags,
        lastUpdate: match.timestamp || new Date().toISOString()
      };
    });
  }

  /**
   * Busca exploits en Shodan
   */
  private async searchExploits(query: string): Promise<ShodanExploit[]> {
    const url = `${this.baseUrl}/api-info?key=${this.apiKey}`;
    
    // Primero verificar créditos de API
    const infoResponse = await fetch(url);
    if (!infoResponse.ok) {
      throw new Error('Failed to check API credits');
    }

    const exploitsUrl = `https://exploits.shodan.io/api/search?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
    
    const response = await fetch(exploitsUrl);
    
    if (!response.ok) {
      // Exploits API puede no estar disponible en todos los planes
      console.warn('[ShodanScraper] Exploits API not available - returning empty (no fake data)');
      return [];
    }

    const data = await response.json() as ShodanAPIExploitsResult;
    
    return data.matches.slice(0, 20).map((exploit): ShodanExploit => ({
      id: exploit._id,
      cve: exploit.cve?.[0],
      description: exploit.description.substring(0, 500),
      platform: exploit.platform,
      type: exploit.type,
      source: exploit.source
    }));
  }

  /**
   * Elimina hosts duplicados por IP:Port
   */
  private deduplicateHosts(hosts: ShodanHost[]): ShodanHost[] {
    const seen = new Set<string>();
    return hosts.filter(host => {
      const key = `${host.ip}:${host.port}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// Registrar el scraper
registerScraper(DataSource.SHODAN, ShodanScraper);

export default ShodanScraper;
