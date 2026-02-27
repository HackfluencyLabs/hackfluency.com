# CTI Translation Issues - Análisis y Remediation

## Problemas Identificados

### 1. Prompt en Output (Translate from English to Spanish:) ✅ VERIFICADO
- **Ubicación**: `cti-dashboard-es.json`, línea 246 - campo `technicalAssessment`
- **Síntoma**: El modelo incluye "Translate from English to Spanish:" en la respuesta traducida
- **Origen**: Cambio al formato de prompt oficial en commit `cd625b51`
- **Status**: ✅ Listo para implementar fix

### 2. Campo "model" Traducido ⚠️ IDENTIFICADO
- **Ubicación**: `cti-dashboard-es.json`, línea 241 - campo `ctiAnalysis.model`
- **Síntoma**: "ALEGRÍA/Análisis de amenazas cibernéticas v2" en vez de "ALIENTELLIGENCE/cybersecuritythreatanalysisv2"
- **Origen**: ⚠️ Por determinar - campo está en `NON_TRANSLATABLE_FIELDS` pero se tradujo igual
- **Status**: Necesita más investigación

### 3. Summary Truncado ❓ SIN VERIFICAR
- **Ubicación**: `cti-dashboard.json` (inglés) y `cti-dashboard-es.json` (español), líneas 15 y 243
- **Síntoma**: Termina en "ACCIÓN RECOMENDADA" sin contenido
- **Origen**: ❓ Por verificar - límite de tokens del modelo estratégico (phi4-mini) en orchestrator
- **Nota**: Esto NO es problema del traductor, es del modelo estratégico que genera el contenido original
- **Status**: Pendiente de nueva ejecución
- **Ubicación**: `cti-dashboard-es.json`, líneas 15 y 243
- **Síntoma**: Termina en "ACCIÓN RECOMENDADA" sin contenido
- **Origen**: ❓ Por verificar - el fix de 4000 tokens aún no se ha probado en nueva ejecución
- **Status**: No confirmado - requiere nueva corrida del pipeline

---

## Análisis de Causas

### Problema 1: Prompt en Output ✅ CONFIRMADO

**Cambio realizado en `cd625b51`:**

| Antes | Después |
|-------|---------|
| Prompt largo con instrucciones explícitas | Formato oficial corto |
| `"Produce only the Spanish translation, without any additional explanations or commentary."` | `"Translate from English to Spanish: {text}"` |

**Conclusión**: El formato oficial no incluye la instrucción de "solo traducción limpia", por lo que el modelo a veces incluye el prefijo en la respuesta.

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
- **Problema 3**: Verificar después de nueva ejecución - el fix de 4000 tokens fue aplicado al modelo estratégico (orchestrator.ts), no al traductor

---

## Referencias

- Commit problematico: `cd625b51`
- Commit anterior (funcionaba): `5fbb2190`
- Docs modelo: `Translategemma1.md`
