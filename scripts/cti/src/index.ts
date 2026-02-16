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
import { DataSource, ScraperConfig, XScrapedData } from './types/index.js';
import ShodanScraper, { setContextualQueries } from './scrapers/shodan-scraper.js';
import XScraper from './scrapers/x-scraper.js';
import CTIOrchestrator, { CTIDashboardOutput } from './llm/orchestrator.js';
import QueryGenerator from './llm/query-generator.js';
import HistoricalCache from './cache/historical-cache.js';
import MinimalDashboardGenerator from './dashboard/minimal-dashboard.js';

const OUTPUT_DIR = process.env.CTI_OUTPUT_DIR || './DATA/cti-output';
const COMMANDS = ['scrape', 'analyze', 'dashboard', 'all'] as const;
type Command = typeof COMMANDS[number];

async function saveData(filename: string, data: unknown): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUTPUT_DIR, filename), JSON.stringify(data, null, 2));
}

async function runScrapers(): Promise<XScrapedData | null> {
  console.log('\n========== DATA COLLECTION ==========\n');
  
  const baseConfig: Omit<ScraperConfig, 'source'> = {
    enabled: true,
    rateLimit: { requestsPerMinute: 5, cooldownMs: 3000 },
    cache: { enabled: true, ttlHours: 12 },
    queries: []
  };

  let xData: XScrapedData | null = null;

  if (process.env.X_COOKIES_JSON || process.env.X_COOKIES_PATH) {
    console.log('[Scrape] Running X.com scraper...');
    const xScraper = new XScraper({ ...baseConfig, source: DataSource.X_COM });
    const result = await xScraper.execute();
    if (result.success) {
      xData = result.data;
      await saveData('x-data.json', result.data);
      console.log(`[X.com] ✓ ${result.data.posts.length} posts collected (cache=${result.fromCache})`);
    } else {
      console.log(`[X.com] ✗ ${result.error}`);
    }
  } else {
    console.log('[X.com] Skipped (set X_COOKIES_JSON or X_COOKIES_PATH)');
  }

  if (xData && xData.posts.length > 0) {
    console.log('[Scrape] Generating contextual queries using TWO-STEP architecture...');
    console.log('  [Architecture] Step 1: Phi4-mini synthesizes social context');
    console.log('  [Architecture] Step 2: Specialist generates Shodan queries');
    const queryGen = new QueryGenerator();
    const queryResult = await queryGen.generateQueriesTwoStep(xData.posts);
    
    console.log(`[QueryGenerator] ${queryResult.reasoning}`);
    if (queryResult.extractedIndicators.products.length > 0) {
      console.log(`[QueryGenerator] Detected Services: ${queryResult.extractedIndicators.products.join(', ')}`);
    }
    if (queryResult.extractedIndicators.ports.length > 0) {
      console.log(`[QueryGenerator] Detected Ports: ${queryResult.extractedIndicators.ports.join(', ')}`);
    }
    if (queryResult.extractedIndicators.countries.length > 0) {
      console.log(`[QueryGenerator] Detected Countries: ${queryResult.extractedIndicators.countries.join(', ')}`);
    }
    if (queryResult.extractedIndicators.cves.length > 0) {
      console.log(`[QueryGenerator] Detected CVEs: ${queryResult.extractedIndicators.cves.join(', ')}`);
    }
    console.log(`[QueryGenerator] Final queries: ${queryResult.queries.join(' | ')}`);
    
    setContextualQueries(queryResult.queries);
  } else {
    console.log('[QueryGenerator] No social data - using fallback query');
    setContextualQueries(['after:1']);
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

  return xData;
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
    console.log(`  Risk Level: ${result.dashboard.status.riskLevel}`);
    console.log(`  Confidence: ${result.dashboard.status.confidenceLevel}`);
    console.log(`  Correlation: ${result.dashboard.ctiAnalysis.correlationStrength}`);
    console.log(`  CVEs: ${result.dashboard.indicators.cves.length}`);
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
  
  // Use analysis result dashboard or abort
  const dashboardData = analysisResult?.dashboard;
  if (!dashboardData) {
    console.log('[Dashboard] No analysis data found - run "analyze" first');
    return;
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
