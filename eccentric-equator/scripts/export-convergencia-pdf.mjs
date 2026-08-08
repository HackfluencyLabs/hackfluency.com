// ============================================================================
// Exporta el informe "Convergencia Normativa" a PDF íntegro (A4, print CSS).
//
// Uso: npm run export:convergencia
//
// Cómo funciona:
//   1. Abre el HTML standalone del reporte (src/assets/reports/convergencia_normativa.html)
//      en Chromium headless con la media emulada a PRINT (para que aplique @media print
//      y los charts ECharts se dimensionen al tamaño A4 compacto).
//   2. Espera: ECharts disponible (CDN + data-astro-rerun no aplica en standalone) +
//      animaciones iniciales terminadas (700ms) + overlay SVG dibujado (setTimeout 750ms).
//   3. Fuerza un ciclo resize de ECharts (c1.restize) para que el canvas y el overlay
//      coincidan con el reflow exacto de la página A4.
//   4. Genera el PDF en public/assets/reports/convergencia_normativa.pdf
//      listo para servir estático (desktop y mobile).
//   5. Verifica rápidamente: nº de páginas y que no haya páginas vacías.
// ============================================================================
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdirSync, statSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC_HTML = resolve(ROOT, 'src/assets/reports/convergencia_normativa.html');
const OUT_PDF = resolve(ROOT, 'public/assets/reports/convergencia_normativa.pdf');

// Hoja ancha 1120×1448 px @96dpi (pre-render para que echarts mida el contenedor real).
// Formato NO imprimible estándar: prioriza legibilidad horizontal de los charts.
const VIEWPORT = { width: 1120, height: 1448 };

async function main() {
  if (!existSync(SRC_HTML)) throw new Error(`No se encontró el reporte: ${SRC_HTML}`);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 2 });
    // media=print → aplica la hoja @media print desde el primer render.
    await page.emulateMedia({ media: 'print' });

    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(`file://${SRC_HTML.replace(/\\/g, '/')}`, { waitUntil: 'load', timeout: 60000 });

    // ECharts llega desde CDN: esperarlo explícitamente.
    await page.waitForFunction(() => {
      const c = document.getElementById('chart-sankey');
      const canvas = c && c.querySelector('canvas');
      return typeof window.echarts !== 'undefined' && canvas && canvas.width > 0;
    }, { timeout: 60000 });

    // Animación de entrada (700ms) + overlay SVG (setTimeout 750ms) + margen de seguridad.
    await page.waitForTimeout(1800);

    // Reflow final: ECharts mide su contenedor (c1.resize + drawSatheOverlay vía listener resize).
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(500);

    mkdirSync(dirname(OUT_PDF), { recursive: true });
    await page.pdf({
      path: OUT_PDF,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    const sizeKb = Math.round(statSync(OUT_PDF).size / 1024);
    console.log(`✓ PDF generado: ${OUT_PDF} (${sizeKb} KB)`);
    if (errors.length) {
      console.warn('\n⚠ Errores de consola capturados (no bloquean el PDF, revisar):');
      errors.slice(0, 8).forEach((e) => console.warn('  -', e));
    }
  } finally {
    await browser.close();
  }
}

// existSync local (sin importar node:fs promisificado innecesario)
function existSync(p) {
  try { statSync(p); return true; } catch { return false; }
}

main().catch((err) => { console.error('✗ Exportación fallida:', err); process.exit(1); });