import { XPost } from '../types/index.js';
import QueryPreprocessor from '../utils/query-preprocessor.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const STRATEGIC_MODEL = process.env.OLLAMA_MODEL_STRATEGIC || 'phi4-mini';
const REQUEST_TIMEOUT = parseInt(process.env.CTI_REQUEST_TIMEOUT || '600000', 10);

const DEFAULT_FALLBACK_QUERY = 'after:1';

export interface QueryGenerationResult {
  queries: string[];
  fromModel: boolean;
  reasoning: string;
  extractedIndicators: {
    products: string[];
    ports: number[];
    cves: string[];
    countries: string[];
  };
}

export class QueryGenerator {
  private preprocessor = new QueryPreprocessor();

  async generateQueriesFromPosts(posts: XPost[]): Promise<QueryGenerationResult> {
    if (posts.length === 0) {
      console.log('[QueryGenerator] No posts provided');
        return {
          queries: [DEFAULT_FALLBACK_QUERY],
          fromModel: false,
          reasoning: 'No social data available',
          extractedIndicators: { products: [], ports: [], cves: [], countries: [] }
        };
    }

    const postsText = posts
      .filter(p => p.text.length > 10)
      .slice(0, 15)
      .map((p, i) => `[${i + 1}] @${p.author}: ${p.text.substring(0, 250)}`)
      .join('\n\n');

    const prompt = `You are an expert cybersecurity threat intelligence analyst specializing in infrastructure reconnaissance.

TASK: Analyze these security-related social media posts and extract infrastructure indicators that can be used for Shodan searches.

INPUT POSTS:
${postsText}

ANALYSIS REQUIREMENTS:
1. Identify specific software products, services, or technologies mentioned (e.g., Apache, Nginx, WordPress, Jenkins, etc.)
2. Extract port numbers if mentioned (e.g., port 80, 443, 22, 3306, etc.)
3. Identify CVE IDs if present (format: CVE-YYYY-NNNNN)
4. Look for infrastructure patterns like "exposed", "open", "vulnerable", "default credentials"
5. Identify specific attack vectors or misconfigurations mentioned
6. EXTRACT COUNTRIES mentioned (e.g., "Russia", "China", "US", "Iran", "North Korea") - use ISO 3166-1 alpha-2 codes

OUTPUT FORMAT - Return ONLY a JSON object:
{
  "products": ["apache", "nginx", "mysql", "wordpress", "etc"],
  "ports": [80, 443, 22, 3306],
  "cves": ["CVE-2024-1234"],
  "countries": ["RU", "CN", "US", "IR", "KP"],
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation of what was found"
}

RULES:
- Only include products/technologies that are actual Shodan-searchable services
- Convert all products to lowercase
- Include only valid CVE format (CVE-YYYY-NNNNN)
- Countries must be ISO 3166-1 alpha-2 codes (2 letters, uppercase)
- If no infrastructure indicators found, return empty arrays with low confidence
- DO NOT include markdown code blocks
- Return ONLY the JSON object

Your JSON response:`;

    try {
      console.log('[QueryGenerator] Analyzing posts for infrastructure indicators...');
      const response = await this.callModel(prompt);
      
      const indicators = this.parseIndicators(response);
      console.log(`[QueryGenerator] Extracted: ${indicators.products.length} products, ${indicators.ports.length} ports, ${indicators.cves.length} CVEs, ${indicators.countries.length} countries`);
      
      if (indicators.countries.length > 0) {
        console.log(`[QueryGenerator] Countries detected: ${indicators.countries.join(', ')}`);
      }
      
      if (indicators.products.length === 0 && indicators.ports.length === 0 && indicators.cves.length === 0 && indicators.countries.length === 0) {
        console.log('[QueryGenerator] No infrastructure indicators found, using fallback');
        return {
          queries: [DEFAULT_FALLBACK_QUERY],
          fromModel: false,
          reasoning: indicators.reasoning || 'No infrastructure indicators found in posts',
          extractedIndicators: indicators
        };
      }

      const processedQueries = this.preprocessor.generateQueriesFromIndicators(indicators, 'dev');
      const validQueries = processedQueries
        .filter(pq => pq.isValid)
        .map(pq => pq.query);

      if (validQueries.length > 0) {
        console.log(`[QueryGenerator] Generated ${validQueries.length} optimized queries`);
        validQueries.forEach((q, i) => {
          console.log(`  [${i + 1}] ${q}`);
        });
        
        return {
          queries: validQueries,
          fromModel: true,
          reasoning: indicators.reasoning || 'Generated from infrastructure indicators',
          extractedIndicators: indicators
        };
      } else {
        console.log('[QueryGenerator] No valid queries after processing, using fallback');
        return {
          queries: [DEFAULT_FALLBACK_QUERY],
          fromModel: false,
          reasoning: 'Could not generate valid queries from indicators',
          extractedIndicators: indicators
        };
      }
    } catch (error) {
      console.error('[QueryGenerator] Error:', error);
      return {
        queries: [DEFAULT_FALLBACK_QUERY],
        fromModel: false,
        reasoning: 'Error during generation',
        extractedIndicators: { products: [], ports: [], cves: [], countries: [] }
      };
    }
  }

  private parseIndicators(response: string): {
    products: string[];
    ports: number[];
    cves: string[];
    countries: string[];
    confidence: string;
    reasoning: string;
  } {
    try {
      const cleaned = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      const products = Array.isArray(parsed.products) 
        ? parsed.products.filter((p: string) => p && p.length > 1).map((p: string) => p.toLowerCase())
        : [];

      const ports = Array.isArray(parsed.ports)
        ? parsed.ports.filter((p: number) => p > 0 && p < 65536)
        : [];

      const cves = Array.isArray(parsed.cves)
        ? parsed.cves.filter((c: string) => c && c.match(/CVE-\d{4}-\d+/i))
        : [];

      const countries = Array.isArray(parsed.countries)
        ? parsed.countries.filter((c: string) => c && c.match(/^[A-Z]{2}$/))
        : [];

      return {
        products,
        ports,
        cves,
        countries,
        confidence: parsed.confidence || 'low',
        reasoning: parsed.reasoning || ''
      };
    } catch (error) {
      console.warn('[QueryGenerator] Failed to parse JSON, trying regex extraction');
      return this.extractIndicatorsWithRegex(response);
    }
  }

  private extractIndicatorsWithRegex(response: string): {
    products: string[];
    ports: number[];
    cves: string[];
    countries: string[];
    confidence: string;
    reasoning: string;
  } {
    const products: string[] = [];
    const cves: string[] = [];
    const countries: string[] = [];
    
    const productMatches = response.match(/"products"\s*:\s*\[([^\]]+)\]/);
    if (productMatches) {
      const items = productMatches[1].match(/"([^"]+)"/g);
      if (items) {
        items.forEach(item => {
          const clean = item.replace(/"/g, '').toLowerCase().trim();
          if (clean && clean.length > 1) products.push(clean);
        });
      }
    }

    const portMatches = response.match(/"ports"\s*:\s*\[([^\]]+)\]/);
    const ports: number[] = [];
    if (portMatches) {
      const nums = portMatches[1].match(/\d+/g);
      if (nums) {
        nums.forEach(n => {
          const port = parseInt(n);
          if (port > 0 && port < 65536) ports.push(port);
        });
      }
    }

    const cveMatches = response.match(/CVE-\d{4}-\d+/gi);
    if (cveMatches) {
      cveMatches.forEach(cve => {
        if (!cves.includes(cve.toUpperCase())) {
          cves.push(cve.toUpperCase());
        }
      });
    }

    const countryMatches = response.match(/"countries"\s*:\s*\[([^\]]+)\]/);
    if (countryMatches) {
      const items = countryMatches[1].match(/"([A-Z]{2})"/g);
      if (items) {
        items.forEach(item => {
          const clean = item.replace(/"/g, '').toUpperCase().trim();
          if (clean && clean.match(/^[A-Z]{2}$/)) countries.push(clean);
        });
      }
    }

    return {
      products,
      ports,
      cves,
      countries,
      confidence: 'medium',
      reasoning: 'Extracted using regex fallback'
    };
  }

  private async callModel(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          model: STRATEGIC_MODEL, 
          prompt, 
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 500,
            top_p: 0.9
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Ollama HTTP ${res.status}`);
      }

      const data = await res.json() as { response: string };
      return data.response || '';
    } catch (error) {
      console.error('[QueryGenerator] Model call failed:', error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export defa
