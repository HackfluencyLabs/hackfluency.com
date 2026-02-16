/**
 * QueryPreprocessor - Pre-procesa y optimiza queries para Shodan
 * Valida sintaxis, corrige errores comunes, y optimiza para plan developer
 */

export interface ProcessedQuery {
  query: string;
  original: string;
  isValid: boolean;
  optimizations: string[];
  estimatedResults: 'high' | 'medium' | 'low' | 'unknown';
}

export class QueryPreprocessor {
  // Patrones de queries Shodan válidos por categoría
  private static readonly VALID_FILTERS = [
    // Productos y servicios
    'product:', 'apache:', 'nginx:', 'mysql:', 'postgres:', 'redis:', 'mongodb:',
    'elasticsearch:', 'vpn:', 'ssh:', 'telnet:', 'ftp:', 'rdp:', 'vnc:',
    // Infraestructura
    'port:', 'hostname:', 'os:', 'country:', 'city:', 'org:', 'asn:', 'isp:',
    // Web
    'http:', 'html:', 'title:', 'ssl:', 'ssl.version:', 'ssl.cert:',
    // Vulnerabilidades (requiere plan plus/corp)
    'vuln:', 'cve:', 'has_vuln:',
    // Temporal
    'after:', 'before:',
    // Red
    'net:', 'ip:', 'ip_str:',
    // Misc
    'has_screenshot:', 'has_ssl:', 'has_ipv6:', 'is_vpn:', 'is_cloud:',
    'is_proxy:', 'is_tor:', 'is_iot:', 'is_honeypot:',
  ];

  // Productos comunes que suelen tener resultados
  private static readonly HIGH_VALUE_PRODUCTS = [
    'apache', 'nginx', 'iis', 'mysql', 'postgresql', 'redis', 'mongodb',
    'elasticsearch', 'jenkins', 'grafana', 'prometheus', 'docker', 'kubernetes',
    'gitlab', 'jenkins', 'confluence', 'jira', 'wordpress', 'drupal',
  ];

  // Puertos comunes con muchos resultados
  private static readonly COMMON_PORTS = [80, 443, 22, 21, 25, 3306, 5432, 6379, 8080, 8443];

  /**
   * Pre-procesa una lista de queries
   */
  processQueries(queries: string[], plan: 'free' | 'dev' | 'basic' | 'plus' | 'corp' = 'dev'): ProcessedQuery[] {
    const processed: ProcessedQuery[] = [];

    for (const original of queries) {
      const processedQuery = this.processSingleQuery(original, plan);
      if (processedQuery.isValid) {
        processed.push(processedQuery);
      }
    }

    // Si no hay queries válidas, agregar fallback
    if (processed.length === 0) {
      processed.push(this.getFallbackQuery(plan));
    }

    return processed.slice(0, 3); // Máximo 3 queries
  }

  /**
   * Procesa una query individual
   */
  private processSingleQuery(original: string, plan: string): ProcessedQuery {
    const optimizations: string[] = [];
    let query = original.trim();

    // 1. Corregir sintaxis básica
    query = this.fixBasicSyntax(query);

    // 2. Verificar si es válida
    if (!this.isValidShodanQuery(query)) {
      return {
        query: '',
        original,
        isValid: false,
        optimizations: ['Invalid query syntax'],
        estimatedResults: 'unknown'
      };
    }

    // 3. Optimizar para plan developer
    const optimized = this.optimizeForPlan(query, plan);
    query = optimized.query;
    optimizations.push(...optimized.optimizations);

    // 4. Estimar resultados
    const estimatedResults = this.estimateResults(query);

    return {
      query,
      original,
      isValid: true,
      optimizations,
      estimatedResults
    };
  }

  /**
   * Corrige errores de sintaxis comunes
   */
  private fixBasicSyntax(query: string): string {
    let fixed = query;

    // Corregir "apacheport:" -> "apache port:"
    fixed = fixed.replace(/([a-z]+)(port:)/gi, '$1 $2');

    // Corregir espacios en filtros
    fixed = fixed.replace(/(\w+):\s+/g, '$1:');

    // Corregir CVEs mal formados (CVE-2025-123 -> CVE-2024-123)
    fixed = fixed.replace(/CVE-2025-(\d+)/gi, 'CVE-2024-$1');

    // Corregir combinaciones inválidas
    fixed = fixed.replace(/\bOR\b/gi, 'or');
    fixed = fixed.replace(/\bAND\b/gi, 'and');

    // Eliminar comillas extra
    fixed = fixed.replace(/"+/g, '"');
    fixed = fixed.replace(/'+/g, "'");

    // Corregir "port80" -> "port:80"
    fixed = fixed.replace(/port(\d+)/gi, 'port:$1');

    // Eliminar CVEs inválidos o muy recientes (posiblemente falsos)
    if (fixed.match(/CVE-202[5-9]-\d+/i)) {
      fixed = fixed.replace(/CVE-202[5-9]-\d+/gi, '');
      fixed = fixed.replace(/\s+/g, ' ').trim();
    }

    return fixed;
  }

  /**
   * Optimiza la query según el plan de Shodan
   */
  private optimizeForPlan(query: string, plan: string): { query: string; optimizations: string[] } {
    const optimizations: string[] = [];
    let optimized = query;

    // Plan developer no tiene acceso a vuln: o cve:
    if (plan === 'dev' || plan === 'free') {
      if (optimized.match(/\b(vuln|cve):/i)) {
        optimized = optimized.replace(/\b(vuln|cve):[^\s]+/gi, '');
        optimizations.push('Removed vuln/cve filter (requires paid plan)');
      }
    }

    // Agregar producto si solo hay puerto
    if (optimized.match(/^port:\d+$/i) && !optimized.match(/\s/)) {
      // Agregar producto común para mejorar resultados
      optimized = `${optimized} product:apache`;
      optimizations.push('Added apache product filter for better results');
    }

    // Simplificar queries muy complejas
    const parts = optimized.split(/\s+/);
    if (parts.length > 4) {
      // Mantener solo los filtros más importantes
      const priority = ['product:', 'port:', 'apache:', 'nginx:', 'country:', 'org:'];
      const filtered = parts.filter(p => 
        priority.some(prefix => p.toLowerCase().startsWith(prefix))
      );
      if (filtered.length >= 2) {
        optimized = filtered.slice(0, 3).join(' ');
        optimizations.push('Simplified complex query to improve results');
      }
    }

    // Eliminar duplicados
    const uniqueParts = [...new Set(parts)];
    if (uniqueParts.length !== parts.length) {
      optimized = uniqueParts.join(' ');
      optimizations.push('Removed duplicate filters');
    }

    // Limpiar espacios extras
    optimized = optimized.replace(/\s+/g, ' ').trim();

    return { query: optimized, optimizations };
  }

  /**
   * Verifica si una query es válida para Shodan
   */
  private isValidShodanQuery(query: string): boolean {
    if (!query || query.length < 2) return false;
    
    // Debe tener al menos un filtro válido o ser una búsqueda simple
    const hasValidFilter = QueryPreprocessor.VALID_FILTERS.some(filter => 
      query.toLowerCase().includes(filter.toLowerCase())
    );

    // O puede ser un producto/servicio conocido
    const isKnownProduct = QueryPreprocessor.HIGH_VALUE_PRODUCTS.some(product =>
      query.toLowerCase().includes(product.toLowerCase())
    );

    // O puede ser un IP o rango
    const isIpOrRange = query.match(/\d{1,3}\.\d{1,3}\.\d{1,3}/);

    // O puede ser after:/before:
    const isTimeQuery = query.match(/^(after|before):\d+$/);

    return hasValidFilter || isKnownProduct || isIpOrRange || isTimeQuery;
  }

  /**
   * Estima la cantidad de resultados esperados
   */
  private estimateResults(query: string): 'high' | 'medium' | 'low' | 'unknown' {
    const q = query.toLowerCase();

    // Queries genéricas tienen muchos resultados
    if (q.match(/port:(80|443|22)/) || q.includes('apache') || q.includes('nginx')) {
      return 'high';
    }

    // Queries específicas pero comunes
    if (q.match(/port:(8080|8443|3306)/) || q.includes('product:')) {
      return 'medium';
    }

    // Muy específicas
    if (q.match(/country:|org:|hostname:/) || q.split(' ').length > 2) {
      return 'low';
    }

    return 'unknown';
  }

  /**
   * Query de fallback cuando no hay contexto
   */
  getFallbackQuery(plan: string): ProcessedQuery {
    // Para plan dev, usar queries que seguro tienen resultados
    const fallbackQueries = [
      'product:apache port:80',
      'product:nginx port:443',
      'port:22',
      'after:1',
    ];

    const query = fallbackQueries[Math.floor(Math.random() * fallbackQueries.length)];

    return {
      query,
      original: 'fallback',
      isValid: true,
      optimizations: ['Using fallback query for plan developer'],
      estimatedResults: 'high'
    };
  }

  /**
   * Genera queries a partir de indicadores extraídos
   */
  generateQueriesFromIndicators(indicators: {
    products?: string[];
    ports?: number[];
    cves?: string[];
    countries?: string[];
    orgs?: string[];
  }, plan: string = 'dev'): ProcessedQuery[] {
    const queries: string[] = [];
    const countries = indicators.countries || [];

    if (countries.length > 0) {
      const country = countries[0];
      
      if (indicators.products && indicators.products.length > 0) {
        const product = indicators.products[0].toLowerCase();
        queries.push(`product:${product} country:${country}`);
      }
      
      if (indicators.ports && indicators.ports.length > 0) {
        const port = indicators.ports[0];
        if (!queries.some(q => q.includes(`port:${port}`) && q.includes(`country:${country}`))) {
          queries.push(`port:${port} country:${country}`);
        }
      }
      
      if (queries.length === 0) {
        queries.push(`ssh country:${country}`);
      }
    }

    // Producto + Puerto (mejor combinación sin país)
    if (indicators.products && indicators.products.length > 0) {
      const product = indicators.products[0].toLowerCase();
      const port = indicators.ports && indicators.ports.length > 0 
        ? indicators.ports[0] 
        : this.getDefaultPortForProduct(product);
      
      const query = `product:${product} port:${port}`;
      if (!queries.includes(query)) {
        queries.push(query);
      }
    }

    // Solo puerto si hay varios
    if (indicators.ports && indicators.ports.length > 0) {
      const port = indicators.ports[0];
      if (!queries.some(q => q.includes(`port:${port}`))) {
        queries.push(`port:${port} product:apache`);
      }
    }

    // Producto específico
    if (indicators.products && indicators.products.length > 1) {
      const product = indicators.products[1].toLowerCase();
      if (!queries.some(q => q.includes(product))) {
        queries.push(`product:${product}`);
      }
    }

    // Si no hay nada, usar fallback
    if (queries.length === 0) {
      queries.push('after:1');
    }

    return this.processQueries(queries, plan as any);
  }

  private getDefaultPortForProduct(product: string): number {
    const portMap: Record<string, number> = {
      'apache': 80,
      'nginx': 80,
      'iis': 80,
      'mysql': 3306,
      'postgresql': 5432,
      'redis': 6379,
      'mongodb': 27017,
      'elasticsearch': 9200,
      'ssh': 22,
      'ftp': 21,
      'telnet': 23,
    };
    return portMap[product] || 80;
  }
}

export default QueryPreprocessor;
