/**
 * Hackfluency Global Theme System
 * ================================
 * Single source of truth for all themes across the entire site.
 * 
 * Architecture:
 *  - Themes define semantic color tokens (not raw hex values)
 *  - CSS custom properties are injected on <html> via data-theme attribute
 *  - Theme persists in localStorage under 'hf-theme'
 *  - Both Astro (SSR) and React (client) components consume the same vars
 */

export interface ThemeConfig {
  id: string;
  name: string;
  icon: string;
  isLight?: boolean;

  // ── Brand / Accent ──
  accent: string;           // Primary accent (replaces --primary)
  accentLight: string;      // Lighter variant
  accentDark: string;       // Darker variant
  accentGlow: string;       // Glow effect (rgba)
  accentDim: string;        // Very subtle accent bg (rgba)
  accentBorder: string;     // Accent-tinted border (rgba)
  accentSecondary: string;  // Secondary accent (replaces --accent / red)
  accentHuman: string;      // Accent for human/psychology themes
  accentPrivacy: string;    // Accent for privacy/data themes
  accentAnalysis: string;   // Accent for intelligence analysis themes
  accentPhilosophy: string; // Accent for philosophy/ethics themes


  // ── Background layers ──
  bgPrimary: string;        // Page background (body)
  bgSecondary: string;      // Slightly elevated (nav, cards)
  bgCard: string;           // Card surfaces
  bgTertiary: string;       // Alternating rows, subtle sections
  bgCode: string;           // Code blocks
  bgTrack: string;          // Scrollbar track, slider track
  bgElevated: string;       // Modals, dropdowns, popups

  // ── Border layers ──
  borderPrimary: string;    // Default borders
  borderSecondary: string;  // Emphasized borders
  borderSubtle: string;     // Very subtle borders (rgba)

  // ── Text layers ──
  textPrimary: string;      // Headings, primary text
  textSecondary: string;    // Body text
  textMuted: string;        // Secondary info
  textDim: string;          // Disabled-ish text
  textDisabled: string;     // Truly disabled
  textOnAccent: string;     // Text on accent backgrounds (buttons)

  // ── Component-specific ──
  tabActiveBorder: string;
  minimapMask: string;
  navBg: string;            // Navigation background
  navBorder: string;        // Navigation border
}

export const THEME_STORAGE_KEY = 'hf-theme';
export const DEFAULT_THEME_ID = 'crimson';

// ─────────────────────────────────────────────────────────────
// Theme palette definitions
// ─────────────────────────────────────────────────────────────

export const THEMES: ThemeConfig[] = [
  {
    id: 'crimson',
    name: 'Crimson',
    icon: '🔴',
    accent: '#FF4455',
    accentLight: '#FF6B7A',
    accentDark: '#CC3344',
    accentGlow: 'rgba(255, 68, 85, 0.6)',
    accentDim: 'rgba(255, 68, 85, 0.1)',
    accentBorder: 'rgba(255, 68, 85, 0.3)',
    accentSecondary: '#FF6B35',
    accentHuman: '#FF7F50',
    accentPrivacy: '#1E90FF',
    accentAnalysis: '#9370DB',
    accentPhilosophy: '#DAA520',
    bgPrimary: '#0a0505',
    bgSecondary: '#110808',
    bgCard: '#110808',
    bgTertiary: '#0d0707',
    bgCode: '#050202',
    bgTrack: '#2a1515',
    bgElevated: '#1a0f0f',
    borderPrimary: '#2a1515',
    borderSecondary: '#351a1a',
    borderSubtle: 'rgba(255, 68, 85, 0.1)',
    textPrimary: '#fff5f5',
    textSecondary: '#ddbfbf',
    textMuted: '#997777',
    textDim: '#775555',
    textDisabled: '#552f2f',
    textOnAccent: '#000000',
    tabActiveBorder: '#3a1f1f',
    minimapMask: 'rgba(5,0,0,0.8)',
    navBg: 'linear-gradient(180deg, #1a0f0f 0%, #0d0505 100%)',
    navBorder: '#2a1515',
  },
];

/**
 * Get a theme by ID, falling back to the default
 */
export function getThemeById(id: string): ThemeConfig {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/**
 * Generate CSS custom properties string from a theme config.
 * These are applied to <html> as inline style or via a <style> tag.
 */
export function themeToCSSVars(theme: ThemeConfig): Record<string, string> {
  return {
    // Accent / Brand
    '--hf-accent': theme.accent,
    '--hf-accent-light': theme.accentLight,
    '--hf-accent-dark': theme.accentDark,
    '--hf-accent-glow': theme.accentGlow,
    '--hf-accent-dim': theme.accentDim,
    '--hf-accent-border': theme.accentBorder,
    '--hf-accent-secondary': theme.accentSecondary,
    '--hf-accent-human': theme.accentHuman,
    '--hf-accent-privacy': theme.accentPrivacy,
    '--hf-accent-analysis': theme.accentAnalysis,
    '--hf-accent-philosophy': theme.accentPhilosophy,

    // Backgrounds
    '--hf-bg': theme.bgPrimary,
    '--hf-bg-secondary': theme.bgSecondary,
    '--hf-bg-card': theme.bgCard,
    '--hf-bg-tertiary': theme.bgTertiary,
    '--hf-bg-code': theme.bgCode,
    '--hf-bg-track': theme.bgTrack,
    '--hf-bg-elevated': theme.bgElevated,

    // Borders
    '--hf-border': theme.borderPrimary,
    '--hf-border-secondary': theme.borderSecondary,
    '--hf-border-subtle': theme.borderSubtle,

    // Text
    '--hf-text': theme.textPrimary,
    '--hf-text-secondary': theme.textSecondary,
    '--hf-text-muted': theme.textMuted,
    '--hf-text-dim': theme.textDim,
    '--hf-text-disabled': theme.textDisabled,
    '--hf-text-on-accent': theme.textOnAccent,

    // Component tokens
    '--hf-tab-border': theme.tabActiveBorder,
    '--hf-minimap-mask': theme.minimapMask,
    '--hf-nav-bg': theme.navBg,
    '--hf-nav-border': theme.navBorder,

    // Legacy compatibility (maps to old --primary / --accent / Layout vars)
    '--primary': theme.accent,
    '--primary-light': theme.accentLight,
    '--primary-dark': theme.accentDark,
    '--primary-glow': theme.accentGlow,
    '--accent': theme.accentSecondary,
    '--black': theme.bgPrimary,
    '--dark': theme.bgSecondary,
    '--dark-lighter': theme.bgTrack,
    '--white': theme.textPrimary,

    // Gray scale (mapped to theme tokens for proper light/dark adaptation)
    '--gray-900': theme.bgElevated,
    '--gray-800': theme.borderSecondary,
    '--gray-700': theme.tabActiveBorder,
    '--gray-600': theme.textDisabled,
    '--gray-500': theme.textDim,
    '--gray-400': theme.textMuted,
    '--gray-300': theme.textSecondary,
    '--gray-200': theme.isLight ? theme.borderSecondary : '#cccccc',
    '--gray-100': theme.isLight ? theme.borderPrimary : '#e5e5e5',

    // Gradient overrides (theme-aware)
    '--gradient-primary': `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentLight} 100%)`,
    '--gradient-accent': `linear-gradient(135deg, ${theme.accentSecondary} 0%, ${theme.accentSecondary} 100%)`,
    '--gradient-dark': `linear-gradient(180deg, ${theme.bgPrimary} 0%, ${theme.bgSecondary} 100%)`,
    '--gradient-glow': `radial-gradient(ellipse at center, ${theme.accentGlow} 0%, transparent 70%)`,
    '--gradient-neon': `linear-gradient(135deg, ${theme.accent} 0%, ${theme.accentLight} 50%, ${theme.accentLight} 100%)`,

    // CTI compatibility (maps to old --cti-* vars)
    '--cti-accent': theme.accent,
    '--cti-accent-glow': theme.accentGlow,
    '--cti-accent-dim': theme.accentDim,
    '--cti-accent-border': theme.accentBorder,
    '--cti-bg': theme.bgPrimary,
    '--cti-bg-2': theme.bgSecondary,
    '--cti-bg-card': theme.bgCard,
    '--cti-bg-3': theme.bgTertiary,
    '--cti-border': theme.borderPrimary,
    '--cti-border-2': theme.borderSecondary,
    '--cti-text-muted': theme.textMuted,
    '--cti-text-primary': theme.textPrimary,
    '--cti-text-secondary': theme.textSecondary,
    '--cti-text-dim': theme.textDim,
    '--cti-text-disabled': theme.textDisabled,
    '--cti-bg-track': theme.bgTrack,
    '--cti-bg-code': theme.bgCode,
    '--cti-tab-border': theme.tabActiveBorder,
  };
}

/**
 * Apply a theme to the document by setting CSS custom properties on <html>.
 * Also sets data-theme and data-theme-mode attributes for CSS selectors.
 */
export function applyThemeToDocument(themeId: string): void {
  if (typeof document === 'undefined') return;

  const theme = getThemeById(themeId);
  const vars = themeToCSSVars(theme);
  const html = document.documentElement;

  // Set CSS custom properties
  for (const [prop, value] of Object.entries(vars)) {
    html.style.setProperty(prop, value);
  }

  // Set data attributes for CSS selectors
  html.setAttribute('data-theme', theme.id);
  html.setAttribute('data-theme-mode', theme.isLight ? 'light' : 'dark');

  // Persist to localStorage
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }

  // Notify all standalone React islands (e.g. CTI) that don't share ThemeProvider state
  try {
    window.dispatchEvent(new CustomEvent('hf-theme-change', { detail: { themeId: theme.id } }));
  } catch {
    // window unavailable (SSR)
  }
}

/**
 * Read persisted theme from localStorage
 */
export function getPersistedThemeId(): string {
  if (typeof localStorage === 'undefined') return DEFAULT_THEME_ID;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}
