#!/bin/bash
# Copiar archivo de prueba
cp ../eccentric-equator/public/data/cti-dashboard.json test-input.json

# Usar CLI para traducir
echo "=== Traduciendo con jsontt CLI ==="
npx jsontt test-input.json --module google --from en --to es

# Verificar resultado
if [ -f "test-input-es.json" ]; then
    echo "✅ Archivo traducido generado"
    head -20 test-input-es.json
    mv test-input-es.json ../eccentric-equator/public/data/cti-dashboard-es.json
else
    echo "❌ No se generó archivo traducido"
fi

# Limpiar
rm -f test-input.json
