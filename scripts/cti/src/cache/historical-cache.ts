import * as fs from 'fs/promises';
import * as path from 'path';

const HISTORICAL_CACHE_FILE = 'historical-analysis-cache.json';
const MAX_HISTORY_ENTRIES = 30;

export interface HistoricalAnalysisEntry {
  timestamp: string;
  riskScore: number;
  riskLevel: string;
  correlationScore: number;
  threatType: string;
  cves: string[];
  indicators: {
    uniqueCVECount: number;
    uniqueDomainCount: number;
    uniqueIPCount: number;
    totalIndicators: number;
  };
  keyFindings: string[];
}

export interface HistoricalContext {
  previousAnalyses: HistoricalAnalysisEntry[];
  averageRiskScore: number;
  trendDirection: 'improving' | 'stable' | 'worsening';
  commonCVEs: string[];
  emergingThreats: string[];
}

export class HistoricalCache {
  private cacheDir: string;
  private cachePath: string;

  constructor() {
    this.cacheDir = process.env.CTI_CACHE_DIR || './DATA/cti-cache';
    this.cachePath = path.join(this.cacheDir, HISTORICAL_CACHE_FILE);
  }

  async loadHistoricalContext(): Promise<HistoricalContext> {
    const entries = await this.loadCache();
    
    if (entries.length === 0) {
      return {
        previousAnalyses: [],
        averageRiskScore: 50,
        trendDirection: 'stable',
        commonCVEs: [],
        emergingThreats: []
      };
    }

    const averageRiskScore = entries.reduce((sum, e) => sum + e.riskScore, 0) / entries.length;
    
    const recentEntries = entries.slice(-5);
    const olderEntries = entries.slice(0, -5);
    const recentAvg = recentEntries.reduce((sum, e) => sum + e.riskScore, 0) / recentEntries.length;
    const olderAvg = olderEntries.length > 0 
      ? olderEntries.reduce((sum, e) => sum + e.riskScore, 0) / olderEntries.length 
      : recentAvg;
    
    let trendDirection: 'improving' | 'stable' | 'worsening';
    if (recentAvg > olderAvg + 10) {
      trendDirection = 'worsening';
    } else if (recentAvg < olderAvg - 10) {
      trendDirection = 'improving';
    } else {
      trendDirection = 'stable';
    }

    const allCVEs = entries.flatMap(e => e.cves);
    const cveCounts = new Map<string, number>();
    allCVEs.forEach(cve => {
      cveCounts.set(cve, (cveCounts.get(cve) || 0) + 1);
    });
    const commonCVEs = Array.from(cveCounts.entries())
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([cve]) => cve);

    const recentThreats = recentEntries.map(e => e.threatType);
    const emergingThreats = Array.from(new Set(recentThreats));

    return {
      previousAnalyses: entries.slice(-10),
      averageRiskScore: Math.round(averageRiskScore),
      trendDirection,
      commonCVEs,
      emergingThreats
    };
  }

  async saveAnalysis(analysis: HistoricalAnalysisEntry): Promise<void> {
    const entries = await this.loadCache();
    entries.push(analysis);
    
    if (entries.length > MAX_HISTORY_ENTRIES) {
      entries.shift();
    }

    await this.saveCache(entries);
  }

  private async loadCache(): Promise<HistoricalAnalysisEntry[]> {
    try {
      await fs.access(this.cachePath);
      const data = await fs.readFile(this.cachePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveCache(entries: HistoricalAnalysisEntry[]): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
    await fs.writeFile(this.cachePath, JSON.stringify(entries, null, 2));
  }
}

export default HistoricalCache;
