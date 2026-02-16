#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { translate } = require('@vitalets/google-translate-api');

const PUBLIC_DIR = process.env.CTI_PUBLIC_DIR || '../eccentric-equator/public/data';
const INPUT_FILE = process.env.INPUT_FILE || `${PUBLIC_DIR}/cti-dashboard.json`;
const OUTPUT_FILE = process.env.OUTPUT_FILE || `${PUBLIC_DIR}/cti-dashboard-es.json`;
const FALLBACK = process.env.TRANSLATION_FALLBACK !== 'false';
const DELAY_MS = parseInt(process.env.TRANSLATION_DELAY) || 100; // Delay entre traducciones

const CACHE_FILE = './translation-cache.json';
let translationCache = {};
let translatedCount = 0;
let errorCount = 0;

if (fs.existsSync(CACHE_FILE)) {
  try {
    translationCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    console.log(`📚 Cache cargado: ${Object.keys(translationCache).length} traducciones`);
  } catch (e) {
    translationCache = {};
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateText(text) {
  if (!text || typeof text !== 'string') return text;
  if (text.trim().length === 0) return text;
  
  // No traducir URLs, CVEs, IPs, timestamps, IDs, o valores técnicos
  if (text.match(/^(https?:\/\/|CVE-\d{4}-\d+|\d+\.\d+\.\d+\.\d+|[0-9a-f]{8}-|\d{4}-\d{2}-\d{2}T|\d{10,}|[a-zA-Z0-9_-]{20,}$)/i)) {
    return text;
  }
  
  // No traducir textos muy cortos (IDs, hashtags, etc)
  if (text.length < 3) return text;
  
  // Verificar cache
  if (translationCache[text]) {
    return translationCache[text];
  }
  
  // Delay para evitar rate limiting
  await sleep(DELAY_MS);
  
  try {
    const result = await translate(text, { from: 'en', to: 'es' });
    translationCache[text] = result.text;
    translatedCount++;
    
    // Guardar cache cada 10 traducciones
    if (translatedCount % 10 === 0) {
      fs.writeFileSync(CACHE_FILE, JSON.stringify(translationCache, null, 2));
    }
    
    return result.text;
  } catch (error) {
    errorCount++;
    // Solo mostrar error para textos significativos
    if (text.length > 20) {
      console.warn(`⚠️  [${errorCount}] Error traduciendo: "${text.substring(0, 40)}..."`);
    }
    return text;
  }
}

async function translateObject(obj) {
  if (typeof obj === 'string') {
    return await translateText(obj);
  } else if (Array.isArray(obj)) {
    const result = [];
    for (const item of obj) {
      result.push(await translateObject(item));
    }
    return result;
  } else if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await translateObject(value);
    }
    return result;
  }
  return obj;
}

async function translateCTI() {
  const startTime = Date.now();
  console.log('🌐 CTI JSON Translator (Google Translate API)');
  console.log(`📁 Input: ${INPUT_FILE}`);
  console.log(`📁 Output: ${OUTPUT_FILE}`);
  console.log(`⏱️  Delay: ${DELAY_MS}ms entre requests`);
  console.log('');

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Error: No se encontró ${INPUT_FILE}`);
    process.exit(1);
  }

  try {
    console.log('📖 Leyendo JSON fuente...');
    const jsonContent = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
    
    console.log('🔄 Traduciendo al español...');
    console.log('   Esto puede tomar varios minutos...');
    console.log('');
    
    const translated = await translateObject(jsonContent);

    // Guardar cache final
    fs.writeFileSync(CACHE_FILE, JSON.stringify(translationCache, null, 2));

    console.log('💾 Guardando traducción...');
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(translated, null, 2), 'utf8');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log(`✅ Traducción completada en ${duration}s`);
    console.log(`📊 Traducidos: ${translatedCount} | Errores: ${errorCount} | Cache: ${Object.keys(translationCache).length}`);
    console.log(`📄 Archivo generado: ${OUTPUT_FILE}`);
    
    const originalStats = fs.statSync(INPUT_FILE);
    const translatedStats = fs.statSync(OUTPUT_FILE);
    console.log(`📊 Tamaño original: ${(originalStats.size / 1024).toFixed(2)} KB`);
    console.log(`📊 Tamaño traducido: ${(translatedStats.size / 1024).toFixed(2)} KB`);
    
    const sample = translated.executive?.headline || 'N/A';
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
