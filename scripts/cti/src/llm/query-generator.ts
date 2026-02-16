import { XPost } from '../types/index.js';
import QueryPreprocessor from '../utils/query-preprocessor.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const STRATEGIC_MODEL = process.env.OLLAMA_MODEL_STRATEGIC || 'phi4-mini';
const REQUEST_TIMEOUT = parseInt(process.env.CTI_REQUEST_TIMEOUT || '600000', 10);

const DEFAULT_FALLBACK_QUERY = 'after:1';

function getCurrentDate(): string {
  const envDate = process.env.CTI_CURRENT_DATE;
  if (envDate) {
    const date = new Date(envDate);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'UTC'
      });
    }
  }
  return new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
}

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

    const currentDate = getCurrentDate();
    const currentYear = new Date().getFullYear();
    
    const prompt = `You are an expert cybersecurity threat intelligence analyst specializing in infrastructure reconnaissance.

CURRENT DATE: ${currentDate}

CONTEXT: You are analyzing real-time social media intelligence to identify active threats and infrastructure targets as of today. Recent CVEs (${currentYear-1}-${currentYear}) and emerging threats should be prioritized.

TASK: Analyze these security-related social media posts and extract infrastructure indicators that can be used for Shodan searches.

INPUT POSTS:
${postsText}

ANALYSIS REQUIREMENTS:
1. Identify specific software products, services, or technologies mentioned (e.g., Apache, Nginx, WordPress, Jenkins, etc.)
2. Extract port numbers if mentioned (e.g., port 80, 443, 22, 3306, etc.)
3. Identify CVE IDs if present (format: CVE-YYYY-NNNNN) - Prioritize CVEs from 2025-2026 as they represent current threats
4. Look for infrastructure patterns like "exposed", "open", "vulnerable", "default credentials"
5. Identify specific attack vectors or misconfigurations mentioned
6. EXTRACT COUNTRIES mentioned (e.g., "Russia", "China", "US", "Iran", "North Korea") - use ISO 3166-1 alpha-2 codes
7. Assess TEMPORAL RELEVANCE - Are these current active threats or older discussions?

OUTPUT FORMAT - Return ONLY a JSON object:
{
  "products": ["apache", "nginx", "mysql", "wordpress", "etc"],
  "ports": [80, 443, 22, 3306],
  "cves": ["CVE-2025-1234"],
  "countries": ["RU", "CN", "US", "IR", "KP"],
  "confidence": "high|medium|low",
  "reasoning": "Brief explanation including temporal context (e.g., 'Active campaign detected in February 2026')"
}

RULES:
- Only include products/technologies that are actual Shodan-searchable services
- Convert all products to lowercase
- Include only valid CVE format (CVE-YYYY-NNNNN) - verify year is plausible (2020-2026)
- Countries must be ISO 3166-1 alpha-2 codes (2 letters, uppercase)
- If no infrastructure indicators found, return empty arrays with low confidence
- Prioritize recent and active threats over historical discussions
- DO NOT include markdown code blocks
- Return ONLY the JSON object

Your JSON response:`;

    try {
      console.log('[QueryGenerator] Analyzing posts for infrastructure indicators...');
      const response = await this.callModel(STRATEGIC_MODEL, prompt, 0.1, 500);
      
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

  /**
   * TWO-STEP ARCHITECTURE:
   * Step 1: Strategic Model (Phi4-mini) synthesizes social context
   * Step 2: Technical Model (Specialist) generates Shodan queries from synthesis
   * 
   * This leverages: Phi for social understanding, Specialist for technical syntax
   */
  async generateQueriesTwoStep(posts: XPost[]): Promise<QueryGenerationResult> {
    if (posts.length === 0) {
      return {
        queries: [DEFAULT_FALLBACK_QUERY],
        fromModel: false,
        reasoning: 'No social data available',
        extractedIndicators: { products: [], ports: [], cves: [], countries: [] }
      };
    }

    console.log('[QueryGenerator] Using TWO-STEP architecture: Phi synthesis → Specialist queries');

    // STEP 1: Phi synthesizes social context
    console.log('  [Step 1/2] Phi4-mini synthesizing social intelligence...');
    const socialSynthesis = await this.synthesizeSocialContext(posts);
    console.log(`  ✓ Synthesis: ${socialSynthesis.keyThreats.length} threats, ${socialSynthesis.mentionedServices.length} services`);

    // STEP 2: Specialist generates queries from synthesis
    console.log('  [Step 2/2] Specialist generating Shodan queries...');
    const queryResult = await this.generateQueriesFromSynthesis(socialSynthesis);
    
    // Convert to standard format
    return {
      queries: queryResult.queries,
      fromModel: true,
      reasoning: `Two-step: ${socialSynthesis.summary}. Generated ${queryResult.queries.length} technical queries`,
      extractedIndicators: {
        products: socialSynthesis.mentionedServices,
        ports: socialSynthesis.mentionedPorts,
        cves: socialSynthesis.mentionedCVEs,
        countries: socialSynthesis.mentionedCountries
      }
    };
  }

  /**
   * STEP 1: Phi4-mini analyzes posts and synthesizes social context
   * Returns structured understanding of threats, services, and indicators
   */
  private async synthesizeSocialContext(posts: XPost[]): Promise<{
    summary: string;
    keyThreats: string[];
    mentionedServices: string[];
    mentionedPorts: number[];
    mentionedCVEs: string[];
    mentionedCountries: string[];
    threatActors: string[];
    attackVectors: string[];
    urgency: 'low' | 'medium' | 'high';
  }> {
    const currentDate = getCurrentDate();
    const currentYear = new Date().getFullYear();

    const postsText = posts
      .filter(p => p.text.length > 10)
      .slice(0, 15)
      .map((p, i) => `[${i + 1}] @${p.author}: ${p.text.substring(0, 250)}`)
      .join('\n\n');

    const prompt = `You are a cybersecurity intelligence analyst. Synthesize these social media posts into structured threat intelligence.

CURRENT DATE: ${currentDate}
CONTEXT: Analyze as current intelligence (${currentDate}). Focus on active threats from ${currentYear-1}-${currentYear}.

INPUT POSTS:
${postsText}

SYNTHESIS TASK:
Extract and summarize the cybersecurity landscape from these posts:

1. KEY THREATS: What are the main threats being discussed? (e.g., "Ransomware campaigns", "Zero-day exploits", "APT activities")

2. MENTIONED SERVICES: What software/services are referenced? (e.g., Apache, Nginx, WordPress, Jenkins, SSH, RDP)

3. MENTIONED PORTS: Any specific port numbers mentioned?

4. MENTIONED CVEs: CVE IDs referenced (prioritize ${currentYear-1}-${currentYear})

5. MENTIONED COUNTRIES: Any geographic references? (ISO codes: US, CN, RU, etc.)

6. THREAT ACTORS: Any APT groups, threat actors, or attribution mentioned?

7. ATTACK VECTORS: How are attacks being conducted? (e.g., "credential stuffing", "SQL injection", "phishing")

8. URGENCY: Rate the urgency - low (routine discussion), medium (emerging threat), high (active exploitation)

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "summary": "One-sentence synthesis of the threat landscape",
  "keyThreats": ["threat1", "threat2"],
  "mentionedServices": ["apache", "wordpress", "ssh"],
  "mentionedPorts": [80, 443, 22],
  "mentionedCVEs": ["CVE-2025-1234"],
  "mentionedCountries": ["US", "CN"],
  "threatActors": ["APT28", "Lazarus"],
  "attackVectors": ["credential stuffing", "RCE exploitation"],
  "urgency": "high"
}

Return ONLY the JSON object, no markdown, no explanations.`;

    const response = await this.callModel(STRATEGIC_MODEL, prompt, 0.2, 800);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || 'Social intelligence analysis completed',
          keyThreats: parsed.keyThreats || [],
          mentionedServices: parsed.mentionedServices || [],
          mentionedPorts: parsed.mentionedPorts || [],
          mentionedCVEs: parsed.mentionedCVEs || [],
          mentionedCountries: parsed.mentionedCountries || [],
          threatActors: parsed.threatActors || [],
          attackVectors: parsed.attackVectors || [],
          urgency: parsed.urgency || 'medium'
        };
      }
    } catch {
      console.warn('  Warning: Phi synthesis parsing failed, using fallback extraction');
    }

    // Fallback: extract using existing method
    const indicators = this.parseIndicators(response);
    return {
      summary: 'Extracted from social intelligence',
      keyThreats: indicators.cves.length > 0 ? [`${indicators.cves.length} CVEs mentioned`] : ['General threat discussion'],
      mentionedServices: indicators.products,
      mentionedPorts: indicators.ports,
      mentionedCVEs: indicators.cves,
      mentionedCountries: indicators.countries,
      threatActors: [],
      attackVectors: [],
      urgency: 'medium'
    };
  }

  /**
   * STEP 2: Specialist model generates Shodan queries from synthesized context
   * Takes the social synthesis and produces optimized Shodan search queries
   */
  private async generateQueriesFromSynthesis(synthesis: {
    summary: string;
    keyThreats: string[];
    mentionedServices: string[];
    mentionedPorts: number[];
    mentionedCVEs: string[];
    mentionedCountries: string[];
    threatActors: string[];
    attackVectors: string[];
    urgency: string;
  }): Promise<{ queries: string[]; reasoning: string }> {
    const currentDate = getCurrentDate();
    const currentYear = new Date().getFullYear();

    const prompt = `You are a Shodan search expert. Generate optimal Shodan queries based on synthesized threat intelligence.

CURRENT DATE: ${currentDate}

SYNTHESIZED INTELLIGENCE:
${synthesis.summary}

Key Threats: ${synthesis.keyThreats.join(', ') || 'None specified'}
Mentioned Services: ${synthesis.mentionedServices.join(', ') || 'None specified'}
Mentioned Ports: ${synthesis.mentionedPorts.join(', ') || 'None specified'}
Mentioned CVEs: ${synthesis.mentionedCVEs.join(', ') || 'None specified'}
Mentioned Countries: ${synthesis.mentionedCountries.join(', ') || 'None specified'}
Threat Actors: ${synthesis.threatActors.join(', ') || 'None specified'}
Attack Vectors: ${synthesis.attackVectors.join(', ') || 'None specified'}
Urgency: ${synthesis.urgency}

SHODAN QUERY GENERATION RULES:
1. Generate 2-3 highly targeted queries
2. Use PRODUCT + PORT combinations for precision (e.g., "product:Apache port:80")
3. If countries mentioned, use geographic filters (e.g., "product:SSH country:CN")
4. For CVEs, use service-specific queries targeting vulnerable versions
5. Avoid generic queries that return millions of results
6. Consider attack vectors: if "credential stuffing" mentioned, target auth services
7. Use plan-friendly syntax (avoid vuln:/cve: filters which require paid plans)

QUERY STRATEGY:
- Query 1: Most specific (service + port + country if available)
- Query 2: Service-focused (product + port)
- Query 3: Fallback with broader scope but still targeted

SHODAN FILTER REFERENCE:
- product: Software name (case insensitive)
- port: Port number
- country: 2-letter country code
- org: Organization name
- version: Software version
- os: Operating system
- after:N: Recent changes (N=days)

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "queries": [
    "product:apache port:80 country:US",
    "product:nginx port:443",
    "ssh port:22 country:CN"
  ],
  "reasoning": "Brief explanation of query selection based on threat intelligence"
}

Return ONLY the JSON object.`;

    const specialistModel = process.env.OLLAMA_MODEL_SPECIALIST || 'ALIENTELLIGENCE/cybersecuritythreatanalysisv2';
    const response = await this.callModel(specialistModel, prompt, 0.1, 600);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const queries = parsed.queries || ['after:1'];
        
        // Process through preprocessor
        const processed = this.preprocessor.processQueries(queries, 'dev');
        return {
          queries: processed.filter(pq => pq.isValid).map(pq => pq.query),
          reasoning: parsed.reasoning || 'Generated from synthesized threat intelligence'
        };
      }
    } catch {
      console.warn('  Warning: Specialist query generation parsing failed');
    }

    // Fallback to preprocessor
    const queries = this.preprocessor.generateQueriesFromIndicators({
      products: synthesis.mentionedServices,
      ports: synthesis.mentionedPorts,
      cves: synthesis.mentionedCVEs,
      countries: synthesis.mentionedCountries
    }, 'dev');

    return {
      queries: queries.filter(pq => pq.isValid).map(pq => pq.query),
      reasoning: 'Fallback from synthesis (parsing failed)'
    };
  }

  private async callModel(model: string, prompt: string, temperature: number = 0.1, maxTokens: number = 500): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
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
      console.error(`[QueryGenerator] Model call failed:`, error);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export default QueryGenerator;
