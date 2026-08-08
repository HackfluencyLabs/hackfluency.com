# [Plan] Opción A — ThemeSelector vanilla JS (Perf Lighthouse)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar el `ThemeSelector` React (isla global `client:visible` en el Layout) por un componente Astro estático + script vanilla que cumple **el mismo contrato** (persistir en `localStorage['hf-theme']`, aplicar CSS vars, disparar `hf-theme-change`), eliminando el runtime React (~57KB gzip `client.js`) de todas las páginas cuyo único island React era el selector, **sin romper la gestión de themes ni el CTI**.

**Architecture:** El sistema de themes ya es vanilla en su núcleo:
- `ThemeInit.astro` (script inline `<head>`) aplica el tema persistido pre-paint — sin React.
- `themes.ts` (TS puro) concentra `THEMES`, `applyThemeToDocument()`, `getPersistedThemeId()` y dispara el CustomEvent `hf-theme-change`.
- `useTheme()` (React, ThemeProvider.tsx L94-123) tiene **fallback standalone** que escucha `hf-theme-change` y llama a `applyThemeToDocument` — ninguna página envuelve `<ThemeProvider>`, así que CTI/dashboards ya viven de ese contrato de eventos, no de React-ThemeSelector.
- Conclusión: un `ThemeSelector.astro` que renderice el dropdown estático (servidor, iterando `THEMES`) + un `<script>` que llame a `applyThemeToDocument()` mantiene el sistema **idéntico** para el usuario y para los islands React.

**Tech Stack:** Astro (componentes `.astro` + `<script>` procesado), TypeScript, View Transitions (`transition:persist` + `data-astro-rerun`), Playwright (verificación E2E).

**Ground-truth (verificado en `dist`):** hoy TODAS las páginas con `client.js` cargan también `ThemeSelector` (index, cti, dashboards, dashboard-builder, SecurityRoadmap, research/articles, research/notes, research/tooling, en/*). Solo `404` y las páginas con `hideThemeSelector` (convergencia-normativa, autodiagnostico, security-qa) quedan sin runtime React. Tras la Opción A, **solo** las páginas con otros islands React (index, cti, dashboards, dashboard-builder, SecurityRoadmap) conservan `client.js`; el resto pierde los ~57KB gzip.

---

## Contexto imprescindible (leer antes de tocar)

- `src/lib/themes.ts` L525 `applyThemeToDocument(id)` → setea CSS vars en `<html>`, setea `data-theme`/`data-theme-mode`, persiste `localStorage['hf-theme']` y **dispara** `new CustomEvent('hf-theme-change', { detail: { themeId } })`.
- `src/lib/themes.ts` L559 `getPersistedThemeId()` → lee localStorage o devuelve `DEFAULT_THEME_ID`.
- `src/lib/ThemeProvider.tsx` L94-123 `useTheme()` → fallback standalone: escucha `hf-theme-change` (L103-112), `setThemeId` llama `applyThemeToDocument` (L121). **No se toca este archivo.**
- `src/components/ThemeSelector.tsx` (React, a borrar) — único importador: `src/layouts/Layout.astro` L5.
- `src/layouts/Layout.astro` L194: `{!hideThemeSelector && <ThemeSelector client:visible variant="floating" transition:persist />}`.
- Prop `hideThemeSelector` (true en convergencia-normativa, autodiagnostico, security-qa x3) — se mantiene sin cambios.
- View Transitions: `transition:persist` ya usado por el widget RumbleTalk (sobrevive SPA); `data-astro-rerun` re-ejecuta el script tras cada swap. Reutilizamos ambos.

---

## Task 1: Crear `src/components/ThemeSelector.astro`

**Files:**
- Create: `src/components/ThemeSelector.astro`

**Step 1: Escribe el componente completo**

```astro
---
// ThemeSelector.astro — 100% vanilla. Sin React.
import { THEMES } from '../lib/themes';

interface Props {
  variant?: 'floating' | 'nav';
}

const { variant = 'floating' } = Astro.props;
const isFloating = variant === 'floating';
---

<div class="hf-ts" data-ts-root data-variant={variant} transition:persist>
  <button
    type="button"
    class="hf-ts-trigger"
    aria-label="Cambiar tema"
    aria-expanded="false"
    aria-haspopup="dialog"
    data-ts-trigger
  >
    <span class="hf-ts-icon" aria-hidden="true" data-ts-icon>🌗</span>
    <span class="hf-ts-label">Theme</span>
    <span class="hf-ts-caret" aria-hidden="true">▼</span>
  </button>

  <div class="hf-ts-menu" role="menu" data-ts-menu hidden>
    {THEMES.map((t) => (
      <button
        type="button"
        role="menuitemradio"
        aria-checked="false"
        class="hf-ts-opt"
        data-ts-opt={t.id}
        data-accent={t.accent}
        data-is-light={String(t.isLight)}
        data-icon={t.icon}
      >
        <span class="hf-ts-swatch" style={`background:${t.accent}`} aria-hidden="true"></span>
        <span class="hf-ts-name">{t.name}</span>
        <svg class="hf-ts-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {t.isLight && <span class="hf-ts-sun" aria-hidden="true">☀</span>}
      </button>
    ))}
  </div>
</div>

<style>
  .hf-ts {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .hf-ts[data-variant='floating'] {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483000;
  }

  .hf-ts-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 12px;
    color: var(--hf-text-secondary, #ccc);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    transition: all 0.15s ease;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .hf-ts-trigger:hover {
    border-color: var(--hf-accent, #6c5ce7);
    color: var(--hf-accent, #6c5ce7);
  }

  .hf-ts-icon { font-size: 1rem; line-height: 1; }

  .hf-ts-caret { font-size: 0.65rem; opacity: 0.6; margin-left: 2px; }

  .hf-ts-menu {
    position: absolute;
    bottom: 100%;
    right: 0;
    width: 200px;
    margin-bottom: 8px;
    background: var(--hf-bg-elevated, #1a1a1a);
    border: 1px solid var(--hf-border-secondary, #333);
    border-radius: 12px;
    padding: 6px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    z-index: 9999;
    animation: hf-ts-in 0.15s ease-out;
  }

  .hf-ts-opt {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: var(--hf-text, #e0e0e0);
    cursor: pointer;
    font-size: 0.82rem;
    font-weight: 400;
    font-family: 'Inter', sans-serif;
    text-align: left;
    transition: background 0.12s ease;
  }

  .hf-ts-opt:hover { background: rgba(255, 255, 255, 0.06); }

  .hf-ts-opt[aria-checked='true'] {
    background: rgba(255, 255, 255, 0.08);
    font-weight: 600;
  }

  .hf-ts-opt[aria-checked='true'] .hf-ts-swatch { box-shadow: 0 0 8px var(--hf-accent, #6c5ce7); }
  .hf-ts-opt[aria-checked='true'] .hf-ts-check { opacity: 1; }

  .hf-ts-swatch {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .hf-ts-check {
    opacity: 0;
    stroke: var(--hf-accent, #6c5ce7);
  }

  .hf-ts-name { flex: 1; }
  .hf-ts-sun { font-size: 0.65rem; opacity: 0.5; margin-left: -4px; }

  @keyframes hf-ts-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
</style>

<script>
  // Vanilla. El script se bundlea con Astro y puede importar themes.ts.
  import { THEMES, getPersistedThemeId, applyThemeToDocument } from '../lib/themes';

  const root = document.querySelector<HTMLElement>('[data-ts-root]');
  if (!root) throw new Error('ThemeSelector: raíz no encontrada');

  // Guard anti-doble-init en navegaciones SPA (el DOM persiste con transition:persist)
  if (!root.dataset.tsInit) {
    root.dataset.tsInit = '1';

    const trigger = root.querySelector<HTMLElement>('[data-ts-trigger]')!;
    const menu = root.querySelector<HTMLElement>('[data-ts-menu]')!;
    const icon = root.querySelector<HTMLElement>('[data-ts-icon]')!;
    const options = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-ts-opt]'));

    const refresh = () => {
      const active = getPersistedThemeId();
      const t = THEMES.find((x) => x.id === active);
      if (t) {
        icon.textContent = t.icon;
        root.style.setProperty('--hf-accent', t.accent);
      }
      options.forEach((opt) => {
        opt.setAttribute('aria-checked', String(opt.dataset.tsOpt === active));
      });
    };

    const setOpen = (open: boolean) => {
      trigger.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
    };

    trigger.addEventListener('click', () => {
      setOpen(trigger.getAttribute('aria-expanded') !== 'true');
    });

    options.forEach((opt) => {
      opt.addEventListener('click', () => {
        applyThemeToDocument(opt.dataset.tsOpt!); // persiste + aplica + dispara hf-theme-change + storage
        refresh();
        setOpen(false);
        trigger.focus();
      });
    });

    // Cerrar con clic fuera y Escape
    document.addEventListener('click', (e) => {
      if (!root.contains(e.target as Node)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    // Reaccionar a cambios externos (otra pestaña, reseteo)
    window.addEventListener('hf-theme-change', refresh);
    document.addEventListener('astro:after-swap', refresh);
  }

  refresh();
</script>
```

**Step 2: Verifica que compila**

```bash
npx astro check --noSync 2>&1 | Select-String -Pattern "ThemeSelector|error"
```
Expected: sin errores que mencionen `ThemeSelector.astro`.

**Step 3: Commit (solo este archivo)**

```bash
$env:GIT_MASTER='1'
git add src/components/ThemeSelector.astro
git commit -m "feat: ThemeSelector.astro vanilla (sin React) — mismo contrato de themes"
```

---

## Task 2: Montar el nuevo componente en `Layout.astro`

**Files:**
- Modify: `src/layouts/Layout.astro` L5 (import) y L194 (render)

**Step 1: Cambiar el import (L5)**

De:
```ts
import ThemeSelector from '../components/ThemeSelector';
```
A:
```ts
import ThemeSelector from '../components/ThemeSelector.astro';
```

**Step 2: Cambiar el render (L194)**

De:
```tsx
{!hideThemeSelector && <ThemeSelector client:visible variant="floating" transition:persist />}
```
A:
```tsx
{!hideThemeSelector && <ThemeSelector variant="floating" />}
```

> `transition:persist` ya vive dentro del componente (Task 1). Quitar `client:visible` elimina la hidratación React de este nodo en todas las páginas.

**Step 3: Build**

```bash
npm run build
```
Expected: exit 0.

**Step 4: Verifica en `dist` que las páginas no-React ya no cargan `client.js`**

```bash
Get-ChildItem dist -Recurse -Filter *.html | ForEach-Object {
  $html = Get-Content $_.FullName -Raw
  $hasClient = $html -match 'client\.[A-Za-z0-9_]+\.js'
  if ($hasClient) { $_.FullName.Replace((Get-Location).Path + '\dist\', '') }
}
```
Expected: SOLO index, cti, en, dashboards, dashboard-builder, SecurityRoadmap (sus variantes `en/*`). Los artículos research/articles, research/notes, research/tooling ya NO deben listar `client.js`.

**Step 5: Commit**

```bash
$env:GIT_MASTER='1'
git add src/layouts/Layout.astro
git commit -m "perf: ThemeSelector vanilla en Layout — quita runtime React de páginas no-React"
```

---

## Task 3: Borrar el React `ThemeSelector.tsx`

**Files:**
- Delete: `src/components/ThemeSelector.tsx`

**Step 1: Confirma que nadie más lo importa**

```bash
Get-ChildItem src -Recurse -Include *.astro,*.tsx | Select-String -Pattern "components/ThemeSelector'" | ForEach-Object { "$($_.Path):$($_.LineNumber)" }
```
Expected: solo `src/layouts/Layout.astro` (ya apunta a `.astro`). Si aparece otra referencia, actualizarla primero.

**Step 2: Borra el archivo**

```bash
Remove-Item src/components/ThemeSelector.tsx
```

**Step 3: Build**

```bash
npm run build
```
Expected: exit 0 (Astro no deja imports colgando).

**Step 4: Commit**

```bash
$env:GIT_MASTER='1'
git add -A
git commit -m "refactor: eliminar ThemeSelector.tsx (React) — reemplazado por versión vanilla"
```

---

## Task 4: Verificación E2E — themes y CTI intactos

> Usar el skill `playwright` / `dev-browser`. Servir producción local:

```bash
npx astro preview --port 8080
```

**Step 1: Cambio de tema funciona (página sin React)**

1. Abrir `http://localhost:8080/research/notes/ztmas` (una de las páginas que pierde `client.js`).
2. Click en el trigger "Theme" → el menú se abre.
3. Seleccionar "Crimson".
4. Asserts en consola del navegador:
   - `document.documentElement.dataset.theme === 'crimson'`
   - `localStorage.getItem('hf-theme') === 'crimson'`
5. Recargar la página → el tema sigue siendo Crimson (persistencia).
6. Cerrar menú con Escape y con clic fuera → `aria-expanded=false`, `menu.hidden=true`.

**Step 2: SPA no rompe el selector**

1. Desde `/` (home), cambiar tema a "Azure".
2. Navegar por SPA a `/research/notes/ztmas` (sin recarga completa).
3. El selector sigue visible (persistencia del DOM) y el tema sigue aplicado (`dataset.theme === 'azure'`).
4. Sin errores en consola.

**Step 3: CTI NO se rompe (crítico)**

1. Abrir `http://localhost:8080/cti/`.
2. Consola: 0 errores (CTI sigue siendo React; su `useTheme()` fallback escucha `hf-theme-change`).
3. Cambiar tema con el selector vanilla → el dashboard CTI re-renderiza con los colores del nuevo tema (verificar que los `--cti-*` vars o los colores de la gráfica cambian en el DOM).
4. Cargar directo `http://localhost:8080/cti/` con tema ya cambiado → el CTI se pinta con ese tema (estado correcto en primera carga).

**Step 4: Reporte de resultados**

Anotar en el PR/commit final el listado de páginas que dejaron de servir `client.js` (comparando Task 2 Step 4 contra el ground-truth inicial). Ideal: ejecutar Lighthouse una vez más en home y en una página research para medir el delta de performance.

---

## Rollback

Si algo se rompe (themes, CTI, selector):
```bash
git revert HEAD~2..HEAD --no-edit   # revierte Tasks 1-3 en orden
npm run build && npx astro preview --port 8080
```
Expected: vuelve el ThemeSelector React original (`client.js` de nuevo en todas las páginas).

---

## Checkbox de aceptación

- [ ] `ThemeSelector.astro` creado, `ThemeSelector.tsx` borrado, `Layout.astro` actualizado.
- [ ] `npx astro check` y `npm run build` exit 0.
- [ ] `dist` muestra `client.js` solo en páginas con islas React propias.
- [ ] Cambio de tema persiste y se aplica en todas las páginas (incl. recarga y SPA).
- [ ] CTI re-renderiza al cambiar tema; 0 errores de consola en `/cti/`.
- [ ] 3 commits atómicos + push a `HFDEV/main`.
