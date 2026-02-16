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
📖 Leyendo JSON fuente...
✓ Encontrados 221 campos de texto
🔄 Traduciendo al español...
❌ Error durante la traducción: Cannot read properties of undefined (reading 'English')
Stack: TypeError: Cannot read properties of undefined (reading 'English')
    at translateCTI (/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti-translator.js:37:28)
    at Object.<anonymous> (/home/runner/work/hackfluency.com/hackfluency.com/scripts/cti-translator.js:101:1)
    at Module._compile (node:internal/modules/cjs/loader:1521:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
    at Module.load (node:internal/modules/cjs/loader:1266:32)
    at Module._load (node:internal/modules/cjs/loader:1091:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:164:12)
    at node:internal/main/run_main_module:28:49
⚠️  Fallback activado - copiando archivo original...
📄 Copiado: /home/runner/work/hackfluency.com/hackfluency.com/eccentric-equator/public/data/cti-dashboard-es.json
Error: Process completed with exit code 1.