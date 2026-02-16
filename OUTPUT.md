9m 40s
Run npx tsx src/index.ts all
[Registry] Registered scraper for shodan
[Registry] Registered scraper for x.com
🔐 CTI Pipeline - ALL
   Time: 2026-02-16T16:57:45.727Z
🔐 CTI Minimal Pipeline
   X + Shodan → Campaign Hypothesis Report
================================================
========== DATA COLLECTION ==========
[Scrape] Running X.com scraper...
[XScraper] Starting execution...
[XScraper] Initializing browser...
[XScraper] Loading cookies from file: /home/runner/work/hackfluency.com/hackfluency.com/DATA/x-cookies.json...
[XScraper] Loaded 13 cookies
[XScraper] Verifying authentication...
[XScraper] Successfully authenticated
[XScraper] Single optimized query
[XScraper] Found 12 posts
[XScraper] Browser closed
[XScraper] Data cached successfully.
[XScraper] Execution completed successfully.
[X.com] ✓ 12 posts collected (cache=false)
[Scrape] Generating contextual queries from social intel...
[QueryGenerator] Generating queries from social intel...
[QueryGenerator] Generated 2 valid queries from model
[QueryGenerator] Generated from social intelligence analysis
[QueryGenerator] Queries: apacheport:80 OR apacheport:443 CVE-2025-68947, Figure.com OR Figure.co CVE-2022-1234
[ShodanScraper] Set 2 contextual queries from social intel
[Scrape] Running Shodan scraper...
[ShodanScraper] Starting execution...
[ShodanScraper] Validating API key and capabilities...
[ShodanScraper] API Validated - Plan: dev, Query Credits: 92, Vuln Filter: false
[ShodanScraper] Running 2 contextual queries from social intel
[ShodanScraper] Executing: apacheport:80 OR apacheport:443 CVE-2025-68947
[ShodanScraper] Query returned 0 hosts
[ShodanScraper] Executing: Figure.com OR Figure.co CVE-2022-1234
[ShodanScraper] Query returned 0 hosts
[ShodanScraper] No hosts found - returning empty dataset
[ShodanScraper] Data cached successfully.
[ShodanScraper] Execution completed successfully.
[Shodan] ✓ 0 hosts collected (cache=false)
========== LLM ANALYSIS ==========
[Orchestrator] Starting refactored CTI pipeline...
  Strategic: phi4-mini
  Technical: ALIENTELLIGENCE/cybersecuritythreatanalysisv2
[Step 1] Building Signal Layer...
  ✓ Signals: 1 CVEs, 0 IPs, 10 domains
[Step 2] X Structured Signal Extraction...
    [Ollama] Calling phi4-mini (attempt 1/3)...
    [Ollama] Response in 84.2s
    Warning: LLM extraction partial, using code-extracted data
  ✓ Extracted: 1 CVEs, 5 themes
[Step 3] Shodan Deterministic Aggregation...
  ✓ Aggregated: 0 hosts, 0 vulnerable
[Step 4] Technical Validation...
    [Ollama] Calling cybersecuritythreatanalysisv2 (attempt 1/3)...
0s
0s
8s
Run echo "=== INSTALANDO DEPENDENCIAS DE TRADUCCIÓN ==="
=== INSTALANDO DEPENDENCIAS DE TRADUCCIÓN ===
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
npm warn deprecated crypto@1.0.1: This package is no longer supported. It's now a built-in Node module. If you've depended on crypto, you should switch to the one that's built-in.

added 136 packages, and audited 137 packages in 7s

26 packages are looking for funding
  run `npm fund` for details

6 vulnerabilities (3 low, 3 moderate)

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
=== TRADUCIENDO DASHBOARD AL ESPAÑOL ===
Input: /home/runner/work/hackfluency.com/hackfluency.com/eccentric-equator/public/data/cti-dashboard.json
🌐 CTI JSON Translator
📁 Input: /home/runner/work/hackfluency.com/hackfluency.com/eccentric-equator/public/data/cti-dashboard.json
📁 Output: /home/runner/work/hackfluency.com/hackfluency.com/eccentric-equator/public/data/cti-dashboard-es.json
📂 Working dir: /home/runner/work/hackfluency.com/hackfluency.com/scripts

📖 Archivo fuente encontrado
📊 Tamaño: 25.64 KB

🔄 Traduciendo al español...
   Esto puede tomar varios minutos...
❌ Error durante la traducción: Cannot read properties of undefined (reading 'English')
Stack: TypeError: Cannot read properties of undefined (reading 'English')
    at translateCTI (/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti-translator.js:36:28)
    at Object.<anonymous> (/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti-translator.js:76:1)
    at Module._compile (node:internal/modules/cjs/loader:1521:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
    at Module.load (node:internal/modules/cjs/loader:1266:32)
    at Module._load (node:internal/modules/cjs/loader:1091:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12)
    at node:internal/main/run_main_module:28:49
⚠️  Fallback activado - copiando archivo original...
📄 Copiado: /home/runner/work/hackfluency.com/hackfluency.com/eccentric-equator/public/data/cti-dashboard-es.json
Error: Process completed with exit code 1.