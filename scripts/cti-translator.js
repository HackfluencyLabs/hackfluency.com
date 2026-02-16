#!/usr/bin/env node
const translator = require('@parvineyvazov/json-translator');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = process.env.CTI_PUBLIC_DIR || '../eccentric-equator/public/data';
const INPUT_FILE = process.env.INPUT_FILE || `${PUBLIC_DIR}/cti-dashboard.json`;
const OUTPUT_FILE = process.env.OUTPUT_FILE || `${PUBLIC_DIR}/cti-dashboard-es.json`;
const FALLBACK = process.env.TRANSLATION_FALLBACK !== 'false';

async function translateCTI() {
  const startTime = Date.now();
  console.log('🌐 CTI JSON Translator');
  console.log(`📁 Input: ${INPUT_FILE}`);
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  console.log(`📂 Working dir: ${process.cwd()}`);
  console.log('');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Error: No se encontró ${INPUT_FILE}`);
    process.exit(1);
  }

  try {
    console.log('📖 Archivo fuente encontrado');
    
    const stats = fs.statSync(INPUT_FILE);
    console.log(`📊 Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('');

    console.log('🔄 Traduciendo al español...');
    console.log('   Esto puede tomar varios minutos...');
    
    await translator.translateFile(
      INPUT_FILE,
      translator.languages.English,
      [translator.languages.Spanish]
    );

    const generatedFile = INPUT_FILE.replace('.json', '-es.json');
    
    if (fs.existsSync(generatedFile) && generatedFile !== OUTPUT_FILE) {
      fs.renameSync(generatedFile, OUTPUT_FILE);
    }

    if (!fs.existsSync(OUTPUT_FILE)) {
      throw new Error(`El archivo traducido no se generó en ${OUTPUT_FILE}`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log(`✅ Traducción completada en ${duration}s`);
    console.log(`📄 Archivo generado: ${OUTPUT_FILE}`);
    
    const translatedStats = fs.statSync(OUTPUT_FILE);
    console.log(`📊 Tamaño traducido: ${(translatedStats.size / 1024).toFixed(2)} KB`);
    
    const content = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    const sample = content.executive?.headline || 'N/A';
    console.log(`\n🔍 Muestra: "${sample}"`);

  } catch (error) {
    console.error('❌ Error durante la traducción:', error.message);
    console.error('Stack:', error.stack);
    
    if (FALLBACK) {
      console.log('⚠️  Fallback activado - copiando archivo original...');
      fs.copyFileSync(INPUT_FILE, OUTPUT_FILE);
      console.log(`📄 Copiado: ${OUTPUT_FILE}`);
    }
    
    process.exit(1);
  }
}

translateCTI();
