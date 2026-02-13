/**
 * LLM Analyzer - Ollama Local (modelo ligero ~500MB)
 * Optimizado para GitHub Actions con prompts compactos
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { ProcessedData, LLMAnalysisResult } from '../types/index.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2:0.5b';

export class LLMAnalyzer {
  private outputDir: string;

  constructor() {
    this.outputDir = process.env.CTI_OUTPUT_DIR || './DATA/cti-output';
  }

  async analyze(): Promise<LLMAnalysisResult> {
    console.log(`[LLM] Ollama ${OLLAMA_MODEL} @ ${OLLAMA_HOST}`);
    
    const data = await this.loadData();
    if (!data || data.threats.length === 0) {
      console.log('[LLM] No data - using empty result');
      return this.emptyResult();
    }

    // Normalizar datos para el modelo pequeño
    const normalized = this.normalizeForLLM(data);
    const prompt = this.buildCompactPrompt(normalized);
    
    console.log(`[LLM] Prompt: ${prompt.length} chars, ${normalized.threatCount} threats`);

    try {
      const response = await this.callOllama(prompt);
      const result = this.parseResponse(response, normalized);
      await this.saveResult(result);
      return result;
    } catch (err) {
      console.log('[LLM] Ollama failed, using heuristics');
      const result = this.heuristicAnalysis(normalized);
      await this.saveResult(result);
      return result;
    }
  }

  /**
   * Normaliza y reduce datos para modelo pequeño
   * - Limita cantidad de elementos
   * - Extrae solo campos esenciales
   * - Calcula métricas agregadas
   */
  private normalizeForLLM(data: ProcessedData): NormalizedData {
    const { threats, indicators, summary } = data;
    
    // Top 5 amenazas por severidad
    const topThreats = threats
      .slice(0, 5)
      .map(t => ({
        sev: t.severity[0].toUpperCase(), // c/h/m/l/i
        cat: this.shortCategory(t.category),
        title: this.truncate(t.title, 40)
      }));

    // Contar IOCs por tipo
    const iocCounts = indicators.reduce((acc, i) => {
      acc[i.type] = (acc[i.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // CVEs únicos (máx 5)
    const cves = [...new Set(
      indicators.filter(i => i.type === 'cve').map(i => i.value)
    )].slice(0, 5);

    return {
      threatCount: summary.totalThreats,
      critical: summary.bySeverity.critical || 0,
      high: summary.bySeverity.high || 0,
      medium: summary.bySeverity.medium || 0,
      topCategory: this.getTopKey(summary.byCategory),
      topThreats,
      iocCounts,
      cves,
      sources: Object.keys(summary.bySource)
    };
  }

  /**
   * Prompt for CTI analyst-style response
   * ~200 tokens input maximum for small models
   */
  private buildCompactPrompt(d: NormalizedData): string {
    const threatList = d.topThreats
      .map(t => `[${t.sev}] ${t.cat}: ${t.title}`)
      .join('\n');

    const sourceNote = d.sources.includes('x.com') ? 'Social signals detected. ' : '';
    const techNote = d.sources.includes('shodan') ? 'Infrastructure exposure observed. ' : '';

    return `You are a CTI analyst. Summarize threats professionally. JSON only.

Intel: ${d.threatCount} signals, ${d.critical} critical, ${d.high} high severity
Category: ${d.topCategory}
CVEs: ${d.cves.join(', ') || 'none'}
Indicators: ${Object.entries(d.iocCounts).map(([k,v]) => `${v} ${k}`).join(', ')}
Context: ${sourceNote}${techNote}

Signals:
${threatList}

Respond:
{"risk":"critical|high|medium|low","summary":"Professional 1-2 sentence assessment","action":"Priority recommendation"}`;
  }

  private async callOllama(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 100,
            top_p: 0.9,
            stop: ['}', '\n\n']
          }
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json() as { response: string };
      console.log(`[LLM] Response: ${json.response.length} chars`);
      return json.response;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parser robusto con múltiples estrategias de fallback
   */
  private parseResponse(raw: string, data: NormalizedData): LLMAnalysisResult {
    let parsed: { risk?: string; summary?: string; action?: string } = {};

    // Estrategia 1: JSON completo
    try {
      const jsonMatch = raw.match(/\{[^{}]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch { /* fallback */ }

    // Estrategia 2: Extraer campos individualmente
    if (!parsed.risk) {
      const riskMatch = raw.match(/risk["\s:]+(\w+)/i);
      parsed.risk = riskMatch?.[1]?.toLowerCase();
    }
    if (!parsed.summary) {
      const sumMatch = raw.match(/summary["\s:]+["']?([^"'\n]+)/i);
      parsed.summary = sumMatch?.[1];
    }
    if (!parsed.action) {
      const actMatch = raw.match(/action["\s:]+["']?([^"'\n]+)/i);
      parsed.action = actMatch?.[1];
    }

    // Validar y normalizar risk level
    const validRisks = ['critical', 'high', 'medium', 'low'];
    const risk = validRisks.includes(parsed.risk || '') 
      ? parsed.risk! 
      : this.calculateRisk(data);

    // Construir resultado
    const summary = parsed.summary || this.defaultSummary(data);
    const action = parsed.action || this.defaultAction(data);

    return this.buildResult(data, risk, summary, action, 'ollama');
  }

  /**
   * Análisis heurístico cuando Ollama falla
   */
  private heuristicAnalysis(data: NormalizedData): LLMAnalysisResult {
    const risk = this.calculateRisk(data);
    const summary = this.defaultSummary(data);
    const action = this.defaultAction(data);
    return this.buildResult(data, risk, summary, action, 'heuristic');
  }

  private calculateRisk(d: NormalizedData): string {
    if (d.critical > 0) return 'critical';
    if (d.high > 2) return 'high';
    if (d.high > 0 || d.medium > 5) return 'medium';
    return 'low';
  }

  private defaultSummary(d: NormalizedData): string {
    const sourceContext = d.sources.length > 1 
      ? 'Multi-source intelligence analysis' 
      : d.sources[0] === 'x.com' ? 'Social intelligence monitoring' : 'Technical reconnaissance';
    
    if (d.critical > 0) {
      return `${sourceContext} identified ${d.threatCount} threat signals with ${d.critical} critical severity items requiring immediate attention. Primary threat vector: ${this.formatCategory(d.topCategory)}.`;
    }
    if (d.high > 0) {
      return `${sourceContext} detected ${d.threatCount} security signals. ${d.high} high-severity indicators warrant prioritized review. ${this.formatCategory(d.topCategory)} activity represents the dominant threat category.`;
    }
    return `${sourceContext} identified ${d.threatCount} signals at moderate priority levels. Continue monitoring for escalation indicators in ${this.formatCategory(d.topCategory)} activity.`;
  }

  private defaultAction(d: NormalizedData): string {
    if (d.critical > 0) return 'Initiate incident response review for critical findings';
    if (d.high > 0) return 'Prioritize vulnerability assessment for high-severity items';
    if (d.cves.length > 0) return `Review CVE exposure: ${d.cves.slice(0, 3).join(', ')}`;
    return 'Continue routine threat monitoring and intelligence collection';
  }

  private formatCategory(cat: string): string {
    const map: Record<string, string> = {
      malware: 'Malware', ransomware: 'Ransomware', phishing: 'Phishing',
      ddos: 'DDoS', apt: 'APT', vulnerability: 'Vulnerability',
      data_breach: 'Data Breach', supply_chain: 'Supply Chain',
      infrastructure: 'Infrastructure', other: 'General'
    };
    return map[cat] || cat;
  }

  private buildResult(
    data: NormalizedData, 
    risk: string, 
    summary: string, 
    action: string,
    model: string
  ): LLMAnalysisResult {
    // Build additional context-aware recommendations
    const recommendations = [action];
    if (data.cves.length > 0) {
      recommendations.push(`Monitor CVE developments: ${data.cves.slice(0, 3).join(', ')}`);
    }
    if (data.critical > 0 || data.high > 1) {
      recommendations.push('Review security controls and access policies');
    }

    // Technical context
    const techParts: string[] = [];
    if (Object.keys(data.iocCounts).length > 0) {
      techParts.push(`Indicators: ${Object.entries(data.iocCounts).map(([k,v]) => `${v} ${k}`).join(', ')}`);
    }
    if (data.cves.length > 0) {
      techParts.push(`CVE References: ${data.cves.join(', ')}`);
    }
    techParts.push(`Sources: ${data.sources.map(s => s === 'x.com' ? 'Social Intelligence' : 'Technical Recon').join(', ')}`);

    return {
      insights: [{
        id: `insight_${Date.now()}`,
        type: 'trend',
        title: 'Threat Landscape Assessment',
        content: summary,
        confidence: model === 'ollama' ? 75 : 70,
        relatedThreats: []
      }],
      executiveSummary: summary,
      technicalSummary: techParts.join('. ') + '.',
      recommendations: recommendations.slice(0, 4),
      trendingTopics: [{
        topic: this.formatCategory(data.topCategory),
        growth: data.critical > 0 ? 25 : (data.high > 0 ? 10 : 0),
        relevance: 100
      }],
      analysisTimestamp: new Date().toISOString(),
      model: `${OLLAMA_MODEL}-${model}`,
      tokenUsage: { input: 0, output: 0, total: 0 }
    };
  }

  private emptyResult(): LLMAnalysisResult {
    return {
      insights: [],
      executiveSummary: 'No threat intelligence data available for analysis. Intelligence collection may be pending or sources temporarily unavailable.',
      technicalSummary: 'Awaiting data from configured intelligence sources.',
      recommendations: ['Verify intelligence source connectivity', 'Check scraper configuration and credentials'],
      trendingTopics: [],
      analysisTimestamp: new Date().toISOString(),
      model: 'none',
      tokenUsage: { input: 0, output: 0, total: 0 }
    };
  }

  // Helpers
  private shortCategory(cat: string): string {
    const map: Record<string, string> = {
      malware: 'MAL', ransomware: 'RAN', phishing: 'PHI',
      ddos: 'DDOS', apt: 'APT', vulnerability: 'VUL',
      data_breach: 'BRE', supply_chain: 'SUP', other: 'OTH'
    };
    return map[cat] || cat.substring(0, 3).toUpperCase();
  }

  private truncate(s: string, len: number): string {
    return s.length > len ? s.substring(0, len - 3) + '...' : s;
  }

  private getTopKey(obj: Record<string, number>): string {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
  }

  private async loadData(): Promise<ProcessedData | null> {
    try {
      const raw = await fs.readFile(
        path.join(this.outputDir, 'processed-data.json'), 'utf-8'
      );
      return JSON.parse(raw);
    } catch { return null; }
  }

  private async saveResult(result: LLMAnalysisResult): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.writeFile(
      path.join(this.outputDir, 'llm-analysis.json'),
      JSON.stringify(result, null, 2)
    );
  }
}

interface NormalizedData {
  threatCount: number;
  critical: number;
  high: number;
  medium: number;
  topCategory: string;
  topThreats: Array<{ sev: string; cat: string; title: string }>;
  iocCounts: Record<string, number>;
  cves: string[];
  sources: string[];
}

export default LLMAnalyzer;
