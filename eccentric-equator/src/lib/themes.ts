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
export const DEFAULT_THEME_ID = 'cyber-dark';

// ─────────────────────────────────────────────────────────────
// Theme palette definitions
// ─────────────────────────────────────────────────────────────

export const THEMES: ThemeConfig[] = [
  // ─── 1. Cyber Dark (default — HF brand) ───
  {
    id: 'cyber-dark',
    name: 'Cyber Dark',
    icon: '🟢',
    accent: '#00D26A',
    accentLight: '#00FF7F',
    accentDark: '#00B359',
    accentGlow: 'rgba(0, 210, 106, 0.6)',
    accentDim: 'rgba(0, 210, 106, 0.1)',
    accentBorder: 'rgba(0, 210, 106, 0.3)',
    accentSecondary: '#E31B23',
    bgPrimary: '#0a0a0a',
    bgSecondary: '#111111',
    bgCard: '#111111',
    bgTertiary: '#0d0d0d',
    bgCode: '#000000',
    bgTrack: '#1a1a1a',
    bgElevated: '#1a1a1a',
    borderPrimary: '#222222',
    borderSecondary: '#2e2e2e',
    borderSubtle: 'rgba(255, 255, 255, 0.1)',
    textPrimary: '#ffffff',
    textSecondary: '#cccccc',
    textMuted: '#888888',
    textDim: '#666666',
    textDisabled: '#444444',
    textOnAccent: '#000000',
    tabActiveBorder: '#333333',
    minimapMask: 'rgba(0,0,0,0.8)',
    navBg: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
    navBorder: '#2a2a2a',
  },

  // ─── 2. Crimson ───
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

  // ─── 3. Azure ───
  {
    id: 'azure',
    name: 'Azure',
    icon: '🔵',
    accent: '#3B82F6',
    accentLight: '#60A5FA',
    accentDark: '#2563EB',
    accentGlow: 'rgba(59, 130, 246, 0.6)',
    accentDim: 'rgba(59, 130, 246, 0.1)',
    accentBorder: 'rgba(59, 130, 246, 0.3)',
    accentSecondary: '#60A5FA',
    bgPrimary: '#050914',
    bgSecondary: '#080f1c',
    bgCard: '#0a1220',
    bgTertiary: '#070c16',
    bgCode: '#020510',
    bgTrack: '#152035',
    bgElevated: '#0e1830',
    borderPrimary: '#1a2840',
    borderSecondary: '#1e3050',
    borderSubtle: 'rgba(59, 130, 246, 0.1)',
    textPrimary: '#f0f6ff',
    textSecondary: '#b0c8f0',
    textMuted: '#6680aa',
    textDim: '#4d6080',
    textDisabled: '#2e3d55',
    textOnAccent: '#ffffff',
    tabActiveBorder: '#243550',
    minimapMask: 'rgba(5,9,20,0.8)',
    navBg: 'linear-gradient(180deg, #0e1830 0%, #050914 100%)',
    navBorder: '#1a2840',
  },

  // ─── 4. Violet ───
  {
    id: 'violet',
    name: 'Violet',
    icon: '🟣',
    accent: '#8B5CF6',
    accentLight: '#A78BFA',
    accentDark: '#7C3AED',
    accentGlow: 'rgba(139, 92, 246, 0.6)',
    accentDim: 'rgba(139, 92, 246, 0.1)',
    accentBorder: 'rgba(139, 92, 246, 0.3)',
    accentSecondary: '#A78BFA',
    bgPrimary: '#080510',
    bgSecondary: '#0d0917',
    bgCard: '#0d0917',
    bgTertiary: '#0a0713',
    bgCode: '#040208',
    bgTrack: '#1a1030',
    bgElevated: '#150e28',
    borderPrimary: '#1e1535',
    borderSecondary: '#231840',
    borderSubtle: 'rgba(139, 92, 246, 0.1)',
    textPrimary: '#f5f0ff',
    textSecondary: '#c8b0f0',
    textMuted: '#7766aa',
    textDim: '#564d80',
    textDisabled: '#352d55',
    textOnAccent: '#ffffff',
    tabActiveBorder: '#2a1d45',
    minimapMask: 'rgba(8,5,16,0.8)',
    navBg: 'linear-gradient(180deg, #150e28 0%, #080510 100%)',
    navBorder: '#1e1535',
  },

  // ─── 5. Amber ───
  {
    id: 'amber',
    name: 'Amber',
    icon: '🟡',
    accent: '#F59E0B',
    accentLight: '#FCD34D',
    accentDark: '#D97706',
    accentGlow: 'rgba(245, 158, 11, 0.6)',
    accentDim: 'rgba(245, 158, 11, 0.1)',
    accentBorder: 'rgba(245, 158, 11, 0.3)',
    accentSecondary: '#FCD34D',
    bgPrimary: '#0a0800',
    bgSecondary: '#110e02',
    bgCard: '#110e02',
    bgTertiary: '#0d0b01',
    bgCode: '#050400',
    bgTrack: '#2a2205',
    bgElevated: '#1a1805',
    borderPrimary: '#2a2205',
    borderSecondary: '#342b06',
    borderSubtle: 'rgba(245, 158, 11, 0.1)',
    textPrimary: '#fffbe0',
    textSecondary: '#e0d090',
    textMuted: '#aa8844',
    textDim: '#806030',
    textDisabled: '#553f10',
    textOnAccent: '#000000',
    tabActiveBorder: '#3a2f07',
    minimapMask: 'rgba(10,8,0,0.8)',
    navBg: 'linear-gradient(180deg, #1a1805 0%, #0a0800 100%)',
    navBorder: '#2a2205',
  },

  // ─── 6. Ice ───
  {
    id: 'ice',
    name: 'Ice',
    icon: '🩵',
    accent: '#94A3B8',
    accentLight: '#CBD5E1',
    accentDark: '#64748B',
    accentGlow: 'rgba(148, 163, 184, 0.6)',
    accentDim: 'rgba(148, 163, 184, 0.1)',
    accentBorder: 'rgba(148, 163, 184, 0.3)',
    accentSecondary: '#CBD5E1',
    bgPrimary: '#080a0c',
    bgSecondary: '#0e1116',
    bgCard: '#0e1116',
    bgTertiary: '#0b0d10',
    bgCode: '#040506',
    bgTrack: '#1a2030',
    bgElevated: '#141a24',
    borderPrimary: '#1e2430',
    borderSecondary: '#252e3c',
    borderSubtle: 'rgba(148, 163, 184, 0.1)',
    textPrimary: '#f0f4f8',
    textSecondary: '#b4c4d8',
    textMuted: '#6677aa',
    textDim: '#4d5a70',
    textDisabled: '#303c50',
    textOnAccent: '#000000',
    tabActiveBorder: '#2a3040',
    minimapMask: 'rgba(8,10,12,0.8)',
    navBg: 'linear-gradient(180deg, #141a24 0%, #080a0c 100%)',
    navBorder: '#1e2430',
  },

  // ─── 7. Analyst (Light) ───
  {
    id: 'analyst',
    name: 'Analyst',
    icon: '⬜',
    isLight: true,
    accent: '#00965A',
    accentLight: '#00B36B',
    accentDark: '#007A4A',
    accentGlow: 'rgba(0, 150, 90, 0.4)',
    accentDim: 'rgba(0, 150, 90, 0.08)',
    accentBorder: 'rgba(0, 150, 90, 0.25)',
    accentSecondary: '#2563EB',
    bgPrimary: '#f8fafb',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgTertiary: '#f0f4f7',
    bgCode: '#f5f5f0',
    bgTrack: '#e0e5eb',
    bgElevated: '#ffffff',
    borderPrimary: '#d0d8e0',
    borderSecondary: '#bbc6d0',
    borderSubtle: 'rgba(0, 0, 0, 0.08)',
    textPrimary: '#0f1923',
    textSecondary: '#2d3d4d',
    textMuted: '#556070',
    textDim: '#7a8a98',
    textDisabled: '#b0bcc8',
    textOnAccent: '#ffffff',
    tabActiveBorder: '#c8d2db',
    minimapMask: 'rgba(240,244,247,0.8)',
    navBg: 'linear-gradient(180deg, #ffffff 0%, #f0f4f7 100%)',
    navBorder: '#d0d8e0',
  },

  // ─── 8. Stark (Light) ───
  {
    id: 'stark',
    name: 'Stark',
    icon: '🔲',
    isLight: true,
    accent: '#1D4ED8',
    accentLight: '#3B82F6',
    accentDark: '#1E40AF',
    accentGlow: 'rgba(29, 78, 216, 0.4)',
    accentDim: 'rgba(29, 78, 216, 0.07)',
    accentBorder: 'rgba(29, 78, 216, 0.2)',
    accentSecondary: '#7C3AED',
    bgPrimary: '#f0f2f5',
    bgSecondary: '#ffffff',
    bgCard: '#ffffff',
    bgTertiary: '#e8ebef',
    bgCode: '#eeeef0',
    bgTrack: '#dde0e6',
    bgElevated: '#ffffff',
    borderPrimary: '#c8cdd5',
    borderSecondary: '#b5bbc5',
    borderSubtle: 'rgba(0, 0, 0, 0.06)',
    textPrimary: '#0a0c10',
    textSecondary: '#1e2535',
    textMuted: '#4a5568',
    textDim: '#72808f',
    textDisabled: '#a8b2bc',
    textOnAccent: '#ffffff',
    tabActiveBorder: '#bfc5ce',
    minimapMask: 'rgba(240,242,245,0.85)',
    navBg: 'linear-gradient(180deg, #ffffff 0%, #e8ebef 100%)',
    navBorder: '#c8cdd5',
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
