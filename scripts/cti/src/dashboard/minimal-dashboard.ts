/**
 * Dashboard Generator - Minimal CTI Dashboard Output
 * 
 * Simply saves the orchestrator output to eccentric-equator/public/data/cti-dashboard.json
 * The orchestrator already produces the frontend-aligned format.
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

export class MinimalDashboardGenerator {
  /**
   * Save orchestrator output to public directory
   * The CTIDashboardOutput is already frontend-aligned, no transformation needed
   */
  async generate(dashboard: CTIDashboardOutput): Promise<CTIDashboardOutput> {
    console.log('[Dashboard] Saving CTI dashboard...');

    await this.saveDashboard(dashboard);
    
    console.log(`[Dashboard] ✓ Saved - Risk: ${dashboard.status.riskLevel}, Score: ${dashboard.status.riskScore}`);
    
    return dashboard;
  }

  /**
   * Save dashboard to public directory
   */
  private async saveDashboard(dashboard: CTIDashboardOutput): Promise<void> {
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
