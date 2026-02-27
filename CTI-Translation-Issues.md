# CTI Translation Issues - Análisis y Remediation

## Problemas Identificados

### 1. Prompt en Output (Translate from English to Spanish:) ✅ VERIFICADO
- **Ubicación**: `cti-dashboard-es.json`, línea 264 - campo `technicalAssessment`
- **Síntoma**: El modelo incluye "Translate from English to Spanish:" en la respuesta traducida
- **Origen**: Cambio al formato de prompt oficial en commit `cd625b51`
- **Status**: ✅ Fix aplicado (prompt extendido)

### 2. Campo "model" Traducido ⚠️ IDENTIFICADO
- **Ubicación**: `cti-dashboard-es.json`, línea 241 - campo `ctiAnalysis.model`
- **Síntoma**: "ALEGRÍA/Análisis de amenazas cibernéticas v2" en vez de "ALIENTELLIGENCE/cybersecuritythreatanalysisv2"
- **Origen**: ⚠️ Por determinar - campo está en `NON_TRANSLATABLE_FIELDS` pero se tradujo igual
- **Status**: Necesita más investigación

### 3. Summary Truncado (RESUELTO)
- **Ubicación**: `cti-dashboard.json` / `cti-dashboard-es.json`
- **Síntoma**: Terminaba en "ACCIÓN RECOMENDADA" sin contenido
- **Origen**: Límite de tokens insuficiente en modelo estratégico (phi4-mini)
- **Fix Aplicado**: Token limit 1800 → **4000 tokens**
- **Resultado**: ✅ **RESUELTO** - Summary ahora completo

### 4. Technical Assessment Truncado (EN PRUEBA)
- **Ubicación**: `cti-dashboard.json` / `cti-dashboard-es.json` - campo `technicalAssessment`
- **Síntoma**: Termina en "### 3." sin contenido completo
- **Origen**: Límite de tokens insuficiente en modelo técnico (cybersecuritythreatanalysisv2)
- **Fix Aplicado**: Token limit 3200 → **8000 tokens** (commit `f36c6232`)
- **Status**: ⏳ En prueba

---

## Historial de Fixes Aplicados

| Commit | Descripción | Resultado |
|--------|-------------|-----------|
| `74d63e4d` | Strategic model: 1800 → 4000 tokens | ✅ Resolvió summary truncado |
| `f36c6232` | Technical model: 3200 → 8000 tokens | ⏳ En prueba |

---

## Remediation Plan

### Fix 1: Extender prompt oficial con instrucción ✅ APROBADO

**Archivo**: `scripts/cti/src/translation/llm-translator.ts`
**Método**: `buildTranslationPrompt()`

```typescript
private buildTranslationPrompt(text: string): string {
  return `Translate from English to Spanish: ${text}

Provide ONLY the Spanish translation. Do NOT include the prompt, do NOT add explanations.`;
}
```

**Rationale**: Combina formato oficial (que el modelo fine-tuned espera) + instrucción explícita de salida limpia.

---

### Fix 2: (Opcional) Sanitización en código

Si Fix 1 no funciona, agregar sanitización post-procesamiento:

**Archivo**: `scripts/cti/src/translation/llm-translator.ts`
**Método**: `callTranslateGemma()` - después de `data.response.trim()`

```typescript
let translated = data.response.trim();
// Remove prompt prefix if model includes it
translated = translated.replace(/^Translate from English to Spanish:\s*/i, '');
return translated;
```

---

## Pendiente

- **Problema 2**: Investigar por qué campo `model` en `NON_TRANSLATABLE_FIELDS` se traduce igual
- **Problema 4**: Verificar si 8000 tokens resuelve el truncamiento de `technicalAssessment`

---

## Referencias

- Commit fix strategic tokens: `74d63e4d`
- Commit fix technical tokens: `f36c6232`
- Commit problematico prompt: `cd625b51`
- Docs modelo: `Translategemma1.md`
