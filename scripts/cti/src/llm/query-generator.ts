/**
 * QueryGenerator - Generates contextual Shodan queries from social intelligence
 * Uses strategic model (phi4-mini) to extract infrastructure indicators from X posts
 * Enforces valid query generation with fallback to time-based queries
 */

import { XPost } from '../types/index.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const STRATEGIC_MODEL = process.env.OLLAMA_MODEL_STRATEGIC || 'phi4-mini';
const REQUEST_TIMEOUT = parseInt(process.env.CTI_REQUEST_TIMEOUT || '600000', 10);

// Default fallback query - last 24h changes as per requirements
const DEFAULT_FALLBACK_QUERY = 'after:1';

// Valid Shodan query patterns for validation
const VALID_SHODAN_PATTERNS = [
  /^(apache|nginx|iis|mysql|postgres|redis|mongodb|elasticsearch|vpn|ssh|telnet|ftp|rdp|vnc|smb|snmp|ldap|docker|kubernetes):?/i,
  /^(port|hostname|os|country|city|org|asn|isp|product|version|banner|ssl|http|html|title):/i,
  /^(cve|vuln|has_screenshot|has_vuln|has_ssl|has_ipv6|has_domain|is_vpn|is_cloud|is_proxy|is_tor|is_iot|is_honeypot):?/i,
  /^(after|before|net|ip|geo|hash|ip_str):/i,
  /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, // IP addresses
  /CVE-\d{4}-\d{4,7}/i, // CVE IDs
];

// Invalid patterns that indicate non-query content
const INVALID_PATTERNS = [
  /^(no|none|not|n\/a|unknown|insufficient|no data|not applicable)/i,
  /^(i don't|i cannot|cannot|unable|impossible|irrelevant|not relevant)/i,
  /^(apartment|elephant|weather|sports|crypto|nft|airdrop|birthday)/i,
];

export interface QueryGenerationResult {
  queries: string[];
  fromModel: boolean;
  reasoning: string;
}

export class QueryGenerator {
  /**
   * Generate Shodan queries from X posts using strategic model
   * Always returns at least one valid query (enforced fallback)
   */
  async generateQueriesFromPosts(posts: XPost[]): Promise<QueryGenerationResult> {
    if (posts.length === 0) {
      console.log('[QueryGenerator] No posts provided, using fallback query');
      return {
        queries: [DEFAULT_FALLBACK_QUERY],
        fromModel: false,
        reasoning: 'No social data available - using default time-based query for recent changes'
      };
    }

    // Extract relevant text from posts
    const postsText = posts
      .filter(p => p.text.length > 20)
      .slice(0, 10)
      .map((p, i) => `[${i + 1}] ${p.text.substring(0, 200)}`)
      .join('\n');

    const prompt = `You are a cybersecurity infrastructure analyst. Analyze these social media posts for threat intelligence and identify infrastructure indicators.

POSTS:
${postsText}

<thinking>
Step 1: Identify the main security topics and threats discussed in these posts.
Step 2: Look for mentions of specific software, services, ports, CVEs, or infrastructure patterns.
Step 3: Consider what Shodan queries would help find vulnerable systems matching these threats.
Step 4: If posts are too vague or unrelated to infrastructure, plan to use time-based query.
</thinking>

Based on your analysis, generate 2-3 specific Shodan queries.
Rules:
- Use specific products, ports, CVEs, or service names mentioned
- Return ONLY valid Shodan search syntax
- If no specific infrastructure indicators found, return "after:1" for recent changes
- One query per line
- No markdown, no numbering

Examples:
product:Apache port:80
CVE-2024-1234
ssh port:22 country:US
after:1

Your queries:`;

    try {
      console.log('[QueryGenerator] Generating queries from social intel...');
      const response = await this.callModel(prompt);
      
      // Parse and validate queries
      const queries = this.parseAndValidateQueries(response);
      
      if (queries.length > 0) {
        console.log(`[QueryGenerator] Generated ${queries.length} valid queries from model`);
        return {
          queries,
          fromModel: true,
          reasoning: 'Generated from social intelligence analysis'
        };
      } else {
        console.log('[QueryGenerator] No valid queries generated, using fallback');
        return {
          queries: [DEFAULT_FALLBACK_QUERY],
          fromModel: false,
          reasoning: 'Model output did not contain valid Shodan queries - using default time-based query'
        };
      }
    } catch (error) {
      console.error('[QueryGenerator] Error generating queries:', error);
      return {
        queries: [DEFAULT_FALLBACK_QUERY],
        fromModel: false,
        reasoning: 'Error during query generation - using fallback query'
      };
    }
  }

  /**
   * Parse model response and validate each line as a Shodan query
   */
  private parseAndValidateQueries(response: string): string[] {
    const lines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const validQueries: string[] = [];

    for (const line of lines) {
      // Skip markdown formatting
      const cleanLine = line
        .replace(/^```[\w]*\n?/g, '')
        .replace(/```$/g, '')
        .replace(/^[-*•]\s*/g, '')
        .replace(/^\d+[.)]\s*/g, '')
        .trim();

      if (cleanLine.length === 0) continue;
      if (cleanLine.length > 200) continue; // Too long
      if (INVALID_PATTERNS.some(p => p.test(cleanLine))) continue;
      
      // Check if it looks like a valid Shodan query
      const isValid = VALID_SHODAN_PATTERNS.some(p => p.test(cleanLine)) ||
        cleanLine.includes('after:') ||
        cleanLine.includes('before:') ||
        cleanLine.includes('port:');

      if (isValid) {
        validQueries.push(cleanLine);
      }
    }

    // Limit to 3 queries max
    return validQueries.slice(0, 3);
  }

  /**
   * Validate a single Shodan query format
   */
  isValidQuery(query: string): boolean {
    if (!query || query.length < 2) return false;
    if (INVALID_PATTERNS.some(p => p.test(query))) return false;
    return VALID_SHODAN_PATTERNS.some(p => p.test(query)) ||
      query.includes('after:') ||
      query.includes('before:') ||
      query.includes('port:');
  }

  /**
   * Call the strategic model for query generation
   */
  private async callModel(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const options = {
        temperature: 0.3,
        num_predict: 300,
        top_p: 0.9
      };

      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ 
          model: STRATEGIC_MODEL, 
          prompt, 
          stream: false, 
          options 
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

export default QueryGenerator;
