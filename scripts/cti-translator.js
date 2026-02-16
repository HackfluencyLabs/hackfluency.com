#!/usr/bin/env node
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
    console.log('📖 Leyendo JSON fuente...');
    const jsonContent = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    const textFields = countTextFields(jsonContent);
    console.log(`✓ Encontrados ${textFields} campos de texto`);
    console.log('');

    console.log('🔄 Traduciendo al español...');
    
    const translator = require('@parvineyvazov/json-translator');
    
    const result = await translator.translateObject(
      jsonContent,
      translator.languages.English,
      translator.languages.Spanish
    );
    
    const translated = Array.isArray(result) ? result[0] : result;

    if (!translated) {
      throw new Error('La traducción devolvió un resultado vacío');
    }

    console.log('💾 Guardando traducción...');
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(translated, null, 2), 'utf8');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log(`✅ Traducción completada en ${duration}s`);
    console.log(`📄 Archivo generado: ${OUTPUT_FILE}`);
    
    const originalStats = fs.statSync(INPUT_FILE);
    const translatedStats = fs.statSync(OUTPUT_FILE);
    console.log(`📊 Tamaño original: ${(originalStats.size / 1024).toFixed(2)} KB`);
    console.log(`📊 Tamaño traducido: ${(translatedStats.size / 1024).toFixed(2)} KB`);
    
    const sampleKey = jsonContent.executive?.headline;
    const sampleTranslated = translated.executive?.headline;
    console.log(`\n🔍 Ejemplo - Original: "${sampleKey}"`);
    console.log(`🔍 Ejemplo - Traducido: "${sampleTranslated}"`);

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

function countTextFields(obj) {
  let count = 0;
  
  function traverse(node) {
    if (typeof node === 'string') {
      count++;
    } else if (Array.isArray(node)) {
      node.forEach(traverse);
    } else if (typeof node === 'object' && node !== null) {
      Object.values(node).forEach(traverse);
    }
  }
  
  traverse(obj);
  return count;
}

translateCTI();
