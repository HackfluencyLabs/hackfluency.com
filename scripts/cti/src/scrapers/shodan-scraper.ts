/**
 * Shodan Scraper - Obtiene datos de amenazas desde Shodan
 * Incluye validación completa de API key y capacidades disponibles
 */

import { BaseScraper, registerScraper } from './base-scraper.js';
import {
  DataSource,
  ShodanScrapedData,
  ShodanHost,
  ShodanExploit,
  ScraperConfig
} from '../types/index.js';

// Queries por tier de suscripción
const QUERIES = {
  // Free tier: solo búsquedas básicas por puerto/país
  free: 'port:22,3389,445 country:US',
  // Paid tier: puede usar filtros avanzados
  paid: 'vuln:CVE-2024 vuln:CVE-2025',
  // Fallback: búsqueda simple
  fallback: 'port:22'
};

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
  recommendedQuery: string;
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
        recommendedQuery: QUERIES.fallback,
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
            recommendedQuery: QUERIES.fallback,
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

      // Determinar query recomendada
      let recommendedQuery = QUERIES.free;
      if (canUseVulnFilter && info.query_credits > 0) {
        recommendedQuery = QUERIES.paid;
      }

      const capabilities: ShodanAPICapabilities = {
        isValid: true,
        plan,
        queryCredits: info.query_credits || 0,
        scanCredits: info.scan_credits || 0,
        canUseVulnFilter,
        canUseExploitsAPI,
        canUseScanAPI,
        recommendedQuery
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
        recommendedQuery: QUERIES.fallback,
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
      console.log('[ShodanScraper] Returning empty dataset with fallback data');
      return this.getFallbackData();
    }

    const hosts: ShodanHost[] = [];
    const exploits: ShodanExploit[] = [];
    const query = this.capabilities.recommendedQuery;

    console.log(`[ShodanScraper] Using query (${this.capabilities.plan} plan): ${query}`);

    // Una sola búsqueda optimizada
    try {
      const searchResults = await this.searchHosts(query);
      hosts.push(...searchResults);
      console.log(`[ShodanScraper] Found ${searchResults.length} hosts`);
    } catch (error) {
      console.error(`[ShodanScraper] Search failed:`, error);
      // Si la búsqueda falla, retornar datos de fallback
      if (hosts.length === 0) {
        console.log('[ShodanScraper] Using fallback data due to search failure');
        return this.getFallbackData();
      }
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

    // Si no hay CVEs, agregar exploits de referencia
    if (exploits.length === 0) {
      exploits.push(...this.generateSampleExploits());
    }

    return {
      source: DataSource.SHODAN,
      timestamp: new Date().toISOString(),
      rawData: { hosts, exploits, capabilities: this.capabilities },
      hosts: this.deduplicateHosts(hosts),
      exploits,
      query
    };
  }

  /**
   * Retorna datos de fallback cuando la API no está disponible
   */
  private getFallbackData(): ShodanScrapedData {
    return {
      source: DataSource.SHODAN,
      timestamp: new Date().toISOString(),
      rawData: { error: this.capabilities?.error || 'API unavailable' },
      hosts: [],
      exploits: this.generateSampleExploits(),
      query: 'fallback'
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
      console.warn('[ShodanScraper] Exploits API not available, using fallback');
      return this.generateSampleExploits();
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
   * Genera exploits de muestra cuando la API no está disponible
   */
  private generateSampleExploits(): ShodanExploit[] {
    const recentCVEs = [
      { cve: 'CVE-2024-21887', desc: 'Ivanti Connect Secure Command Injection' },
      { cve: 'CVE-2024-1709', desc: 'ConnectWise ScreenConnect Authentication Bypass' },
      { cve: 'CVE-2024-27198', desc: 'TeamCity Authentication Bypass' },
      { cve: 'CVE-2024-3400', desc: 'Palo Alto PAN-OS Command Injection' },
      { cve: 'CVE-2024-4577', desc: 'PHP CGI Argument Injection' }
    ];

    return recentCVEs.map((item, idx) => ({
      id: this.generateId('exp'),
      cve: item.cve,
      description: item.desc,
      platform: 'Multiple',
      type: 'remote',
      source: 'shodan-fallback'
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
