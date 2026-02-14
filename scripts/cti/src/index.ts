#!/usr/bin/env node
/**
 * CTI Minimal Pipeline - Sequential Two-Model Architecture
 * 
 * Based on: "Minimal Multi-LLM Threat Signal Correlation Architecture"
 * X + Shodan → Campaign Hypothesis Report
 * 
 * Usage:
 *   npx tsx src/index.ts [command]
 * 
 * Commands:
 *   scrape    - Run scrapers (X.com + Shodan)
 *   analyze   - Run LLM analysis pipeline
 *   dashboard - Generate dashboard JSON
 *   all       - Full pipeline (default)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DataSource, ScraperConfig } from './types/index.js';
import ShodanScraper from './scrapers/shodan-scraper.js';
import XScraper from './scrapers/x-scraper.js';
import CTIOrchestrator, { CTIDashboardOutput } from './llm/orchestrator.js';
import MinimalDashboardGenerator from './dashboard/minimal-dashboard.js';

const OUTPUT_DIR = process.env.CTI_OUTPUT_DIR || './DATA/cti-output';
const COMMANDS = ['scrape', 'analyze', 'dashboard', 'all'] as const;
type Command = typeof COMMANDS[number];

async function saveData(filename: string, data: unknown): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUTPUT_DIR, filename), JSON.stringify(data, null, 2));
}

/**
 * Phase 1: Data Collection
 * Run X.com and Shodan scrapers
 */
async function runScrapers(): Promise<void> {
  console.log('\n========== DATA COLLECTION ==========\n');
  
  const baseConfig: Omit<ScraperConfig, 'source'> = {
    enabled: true,
    rateLimit: { requestsPerMinute: 5, cooldownMs: 3000 },
    cache: { enabled: true, ttlHours: 12 },
    queries: []
  };

  // X.com Scraper - Social Intelligence
  // Supports: X_COOKIES_JSON (GitHub Secret) or X_COOKIES_PATH (local file)
  if (process.env.X_COOKIES_JSON || process.env.X_COOKIES_PATH) {
    console.log('[Scrape] Running X.com scraper...');
    const xScraper = new XScraper({ ...baseConfig, source: DataSource.X_COM });
    const result = await xScraper.execute();
    if (result.success) {
      await saveData('x-data.json', result.data);
      console.log(`[X.com] ✓ ${result.data.posts.length} posts collected (cache=${result.fromCache})`);
    } else {
      console.log(`[X.com] ✗ ${result.error}`);
    }
  } else {
    console.log('[X.com] Skipped (set X_COOKIES_JSON or X_COOKIES_PATH)');
  }

  // Shodan Scraper - Infrastructure Intelligence
  if (process.env.SHODAN_API_KEY) {
    console.log('[Scrape] Running Shodan scraper...');
    const shodan = new ShodanScraper({ ...baseConfig, source: DataSource.SHODAN });
    const result = await shodan.execute();
    if (result.success) {
      await saveData('shodan-data.json', result.data);
      console.log(`[Shodan] ✓ ${result.data.hosts.length} hosts collected (cache=${result.fromCache})`);
    } else {
      console.log(`[Shodan] ✗ ${result.error}`);
    }
  } else {
    console.log('[Shodan] Skipped (SHODAN_API_KEY not set)');
  }
}

interface OrchestratorResult {
  success: boolean;
  dashboard: CTIDashboardOutput;
  error?: string;
}

/**
 * Phase 2: LLM Analysis
 * Sequential two-model orchestration
 */
async function runAnalysis(): Promise<OrchestratorResult> {
  console.log('\n========== LLM ANALYSIS ==========\n');
  
  const orchestrator = new CTIOrchestrator();
  const result = await orchestrator.run();
  
  if (result.success) {
    console.log('\n[Analysis] ✓ Pipeline complete');
    console.log(`  Risk Level: ${result.dashboard.risk_level}`);
    console.log(`  Confidence: ${result.dashboard.confidence}`);
    console.log(`  Correlation: ${result.dashboard.correlation_strength}`);
    console.log(`  CVEs: ${result.dashboard.observed_cves.length}`);
  } else {
    console.log(`\n[Analysis] ✗ Failed: ${result.error}`);
  }
  
  return result;
}

/**
 * Phase 3: Dashboard Generation
 * Output JSON and trigger Astro rebuild
 */
async function runDashboard(analysisResult?: OrchestratorResult): Promise<void> {
  console.log('\n========== DASHBOARD ==========\n');
  
  const generator = new MinimalDashboardGenerator();
  
  // If no analysis result provided, try to load from file
  let dashboardData = analysisResult?.dashboard;
  if (!dashboardData) {
    try {
      const debugFile = await fs.readFile(
        path.join(OUTPUT_DIR, 'orchestrator-debug.json'), 
        'utf-8'
      );
      const debug = JSON.parse(debugFile);
      // Reconstruct minimal dashboard data
      dashboardData = {
        date: new Date().toISOString(),
        summary: 'Analysis loaded from cache.',
        confidence: 'moderate' as const,
        observed_cves: [],
        infrastructure_signals: [],
        correlation_strength: 'moderate' as const,
        risk_level: 'medium' as const,
        x_intel_summary: debug.xDigest || '',
        shodan_summary: `${debug.shodanDigest?.totalHosts || 0} hosts`,
        technical_assessment: debug.technicalValidation || '',
        recommended_actions: ['Review latest analysis']
      };
    } catch {
      console.log('[Dashboard] No analysis data found - run "analyze" first');
      return;
    }
  }
  
  const dashboard = await generator.generate(dashboardData);
  
  // Trigger Astro rebuild
  const rebuildSuccess = await generator.triggerAstroRebuild();
  
  if (rebuildSuccess) {
    console.log('[Dashboard] ✓ Site updated');
  }
}

/**
 * Full Pipeline: Scrape → Analyze → Dashboard
 */
async function runFullPipeline(): Promise<void> {
  console.log('\n🔐 CTI Minimal Pipeline');
  console.log('   X + Shodan → Campaign Hypothesis Report');
  console.log('================================================\n');
  
  // Phase 1: Data Collection
  await runScrapers();
  
  // Phase 2: LLM Analysis
  const analysisResult = await runAnalysis();
  
  // Phase 3: Dashboard Generation
  if (analysisResult.success) {
    await runDashboard(analysisResult);
  } else {
    console.log('\n[Pipeline] Skipping dashboard - analysis failed');
  }
}

async function main(): Promise<void> {
  const command = (process.argv[2] as Command) || 'all';
  
  if (!COMMANDS.includes(command)) {
    console.error(`Unknown command: ${command}`);
    console.error(`Available: ${COMMANDS.join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🔐 CTI Pipeline - ${command.toUpperCase()}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  const startTime = Date.now();

  try {
    switch (command) {
      case 'scrape':
        await runScrapers();
        break;
      case 'analyze':
        await runAnalysis();
        break;
      case 'dashboard':
        await runDashboard();
        break;
      case 'all':
        await runFullPipeline();
        break;
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Pipeline complete in ${elapsed}s\n`);
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    process.exit(1);
  }
}

main();
