/**
 * Dashboard Generator - Minimal CTI Dashboard Output
 * 
 * Outputs clean JSON to eccentric-equator/public/data/cti-dashboard.json
 * Triggers Astro rebuild after generation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { CTIDashboardOutput } from '../llm/orchestrator.js';

const execAsync = promisify(exec);

// Output paths
const PUBLIC_DATA_DIR = process.env.CTI_PUBLIC_DIR || './eccentric-equator/public/data';
const DASHBOARD_FILENAME = 'cti-dashboard.json';
const ASTRO_PROJECT_DIR = './eccentric-equator';

// Dashboard format for frontend consumption
export interface PublicDashboard {
  meta: {
    version: string;
    generatedAt: string;
    validUntil: string;
  };
  status: {
    riskLevel: 'critical' | 'elevated' | 'moderate' | 'low';
    riskScore: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    confidenceLevel: number;
  };
  executive: {
    headline: string;
    summary: string;
    keyFindings: string[];
    recommendedActions: string[];
  };
  metrics: {
    totalSignals: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    categories: Array<{ name: string; count: number; percentage: number }>;
  };
  correlation: {
    strength: string;
    xIntelSummary: string;
    shodanSummary: string;
    technicalAssessment: string;
  };
  indicators: {
    cves: string[];
    exposedServices: Array<{
      service: string;
      port: number;
      count: number;
    }>;
  };
}

export class MinimalDashboardGenerator {
  /**
   * Generate dashboard from orchestrator output and save to public directory
   */
  async generate(orchestratorOutput: CTIDashboardOutput): Promise<PublicDashboard> {
    console.log('[Dashboard] Generating minimal CTI dashboard...');

    const dashboard = this.buildDashboard(orchestratorOutput);
    
    await this.saveDashboard(dashboard);
    
    console.log(`[Dashboard] ✓ Generated - Risk: ${dashboard.status.riskLevel}`);
    
    return dashboard;
  }

  /**
   * Transform orchestrator output to public dashboard format
   */
  private buildDashboard(data: CTIDashboardOutput): PublicDashboard {
    const now = new Date();
    const validUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours validity

    // Map risk level to frontend format
    const riskLevelMap: Record<string, 'critical' | 'elevated' | 'moderate' | 'low'> = {
      'critical': 'critical',
      'high': 'elevated',
      'medium': 'moderate',
      'low': 'low'
    };

    // Calculate risk score from risk level
    const riskScoreMap: Record<string, number> = {
      'critical': 90,
      'high': 70,
      'medium': 50,
      'low': 25
    };

    // Map confidence to percentage
    const confidenceMap: Record<string, number> = {
      'high': 85,
      'moderate': 60,
      'low': 35
    };

    // Count signals by severity (estimated from CVEs and infrastructure)
    const cveCount = data.observed_cves.length;
    const infraCount = data.infrastructure_signals.reduce((sum, s) => sum + s.count, 0);
    const totalSignals = Math.max(cveCount + Math.floor(infraCount / 10), 1);

    // Estimate severity distribution
    const severityDist = this.estimateSeverityDistribution(data.risk_level, totalSignals);

    // Build key findings from available data
    const keyFindings: string[] = [];
    if (cveCount > 0) {
      keyFindings.push(`${cveCount} CVE references identified in collected intelligence`);
    }
    if (data.infrastructure_signals.length > 0) {
      const topService = data.infrastructure_signals[0];
      keyFindings.push(`Primary exposed service: ${topService.description} (${topService.count} hosts)`);
    }
    if (data.correlation_strength !== 'weak') {
      keyFindings.push(`${data.correlation_strength.charAt(0).toUpperCase() + data.correlation_strength.slice(1)} correlation detected between social intel and infrastructure`);
    }
    if (keyFindings.length === 0) {
      keyFindings.push('Baseline threat monitoring active');
    }

    return {
      meta: {
        version: '3.0.0',
        generatedAt: now.toISOString(),
        validUntil: validUntil.toISOString()
      },
      status: {
        riskLevel: riskLevelMap[data.risk_level] || 'moderate',
        riskScore: riskScoreMap[data.risk_level] || 50,
        trend: 'stable',
        confidenceLevel: confidenceMap[data.confidence] || 60
      },
      executive: {
        headline: this.generateHeadline(data.risk_level),
        summary: data.summary,
        keyFindings,
        recommendedActions: data.recommended_actions
      },
      metrics: {
        totalSignals,
        criticalCount: severityDist.critical,
        highCount: severityDist.high,
        mediumCount: severityDist.medium,
        lowCount: severityDist.low,
        categories: this.generateCategories(data)
      },
      correlation: {
        strength: data.correlation_strength,
        xIntelSummary: data.x_intel_summary,
        shodanSummary: data.shodan_summary,
        technicalAssessment: data.technical_assessment
      },
      indicators: {
        cves: data.observed_cves,
        exposedServices: data.infrastructure_signals.map(s => ({
          service: s.description.split(' on port ')[0] || s.description,
          port: parseInt(s.description.match(/port (\d+)/)?.[1] || '0'),
          count: s.count
        }))
      }
    };
  }

  private generateHeadline(riskLevel: string): string {
    const headlines: Record<string, string> = {
      'critical': 'CRITICAL: Immediate action required',
      'high': 'ELEVATED: Active threats detected',
      'medium': 'MODERATE: Monitor and assess',
      'low': 'LOW: Routine monitoring active'
    };
    return headlines[riskLevel] || 'Threat Level: MODERATE';
  }

  private estimateSeverityDistribution(
    riskLevel: string, 
    total: number
  ): { critical: number; high: number; medium: number; low: number } {
    // Distribute signals based on overall risk level
    switch (riskLevel) {
      case 'critical':
        return {
          critical: Math.ceil(total * 0.4),
          high: Math.ceil(total * 0.3),
          medium: Math.ceil(total * 0.2),
          low: Math.floor(total * 0.1)
        };
      case 'high':
        return {
          critical: Math.ceil(total * 0.2),
          high: Math.ceil(total * 0.4),
          medium: Math.ceil(total * 0.3),
          low: Math.floor(total * 0.1)
        };
      case 'medium':
        return {
          critical: Math.ceil(total * 0.05),
          high: Math.ceil(total * 0.2),
          medium: Math.ceil(total * 0.5),
          low: Math.floor(total * 0.25)
        };
      default:
        return {
          critical: 0,
          high: Math.ceil(total * 0.1),
          medium: Math.ceil(total * 0.3),
          low: Math.floor(total * 0.6)
        };
    }
  }

  private generateCategories(data: CTIDashboardOutput): Array<{ name: string; count: number; percentage: number }> {
    const categories: Array<{ name: string; count: number }> = [];
    
    // Infer categories from signals
    if (data.observed_cves.length > 0) {
      categories.push({ name: 'Vulnerability', count: data.observed_cves.length });
    }
    
    if (data.infrastructure_signals.length > 0) {
      const infraCount = data.infrastructure_signals.reduce((sum, s) => sum + s.count, 0);
      categories.push({ name: 'Infrastructure', count: Math.ceil(infraCount / 10) });
    }

    // Add at least one category if empty
    if (categories.length === 0) {
      categories.push({ name: 'General', count: 1 });
    }

    const total = categories.reduce((sum, c) => sum + c.count, 0);
    
    return categories.map(c => ({
      ...c,
      percentage: Math.round((c.count / total) * 100)
    }));
  }

  /**
   * Save dashboard to public directory
   */
  private async saveDashboard(dashboard: PublicDashboard): Promise<void> {
    const outputPath = path.join(PUBLIC_DATA_DIR, DASHBOARD_FILENAME);
    
    await fs.mkdir(PUBLIC_DATA_DIR, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(dashboard, null, 2));
    
    console.log(`[Dashboard] Saved to ${outputPath}`);
  }

  /**
   * Trigger Astro rebuild to update the public site
   */
  async triggerAstroRebuild(): Promise<boolean> {
    console.log('[Dashboard] Triggering Astro rebuild...');
    
    try {
      // Check if we're in a CI environment (GitHub Actions)
      if (process.env.GITHUB_ACTIONS) {
        console.log('[Dashboard] Running in GitHub Actions - rebuild will happen via workflow');
        return true;
      }

      // Local development - run build
      const { stdout, stderr } = await execAsync('npm run build', {
        cwd: ASTRO_PROJECT_DIR,
        timeout: 120000 // 2 minutes max
      });

      if (stderr && !stderr.includes('warning')) {
        console.log(`[Dashboard] Build warnings: ${stderr.substring(0, 200)}`);
      }

      console.log('[Dashboard] ✓ Astro rebuild complete');
      return true;
    } catch (error) {
      console.error('[Dashboard] Astro rebuild failed:', error);
      console.log('[Dashboard] Dashboard JSON was saved - manual rebuild may be needed');
      return false;
    }
  }
}

export default MinimalDashboardGenerator;
