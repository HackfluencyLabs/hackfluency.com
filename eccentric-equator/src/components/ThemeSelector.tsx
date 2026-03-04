/**
 * Hackfluency Theme Selector
 * ============================
 * Floating theme picker that can be used on any page.
 * Renders as a small button that opens a dropdown with all themes.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../lib/ThemeProvider';
import type { ThemeConfig } from '../lib/themes';

interface ThemeSelectorProps {
  /** Position variant: 'nav' inline in navbar, 'floating' fixed position */
  variant?: 'nav' | 'floating';
}

export default function ThemeSelector({ variant = 'floating' }: ThemeSelectorProps) {
  const { theme, themeId, setThemeId, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const handleSelect = useCallback((id: string) => {
    setThemeId(id);
    setOpen(false);
  }, [setThemeId]);

  const isLight = theme.isLight;

  const containerStyle: React.CSSProperties = variant === 'floating'
    ? {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
      }
    : {
        position: 'relative',
        display: 'inline-flex',
      };

  return (
    <div ref={ref} style={containerStyle}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Change theme"
        aria-expanded={open}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: variant === 'floating' ? '10px 16px' : '6px 12px',
          background: isLight
            ? 'rgba(0, 0, 0, 0.06)'
            : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: variant === 'floating' ? '12px' : '8px',
          color: 'var(--hf-text-secondary, #ccc)',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          fontFamily: "'Inter', sans-serif",
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'all 0.15s ease',
          boxShadow: variant === 'floating'
            ? '0 4px 20px rgba(0,0,0,0.3)'
            : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.accent;
          e.currentTarget.style.color = theme.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
          e.currentTarget.style.color = 'var(--hf-text-secondary, #ccc)';
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{theme.icon}</span>
        <span style={{ letterSpacing: '0.02em' }}>Theme</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.6, marginLeft: '2px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop for mobile */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'transparent',
            }}
          />

          <div
            style={{
              position: 'absolute',
              [variant === 'floating' ? 'bottom' : 'top']: variant === 'floating' ? '100%' : '100%',
              right: 0,
              marginBottom: variant === 'floating' ? '8px' : undefined,
              marginTop: variant === 'floating' ? undefined : '8px',
              width: '200px',
              background: 'var(--hf-bg-elevated, #1a1a1a)',
              border: '1px solid var(--hf-border-secondary, #333)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              zIndex: 9999,
              animation: 'hf-theme-dropdown-in 0.15s ease-out',
            }}
          >
            {themes.map((t) => (
              <ThemeOption
                key={t.id}
                theme={t}
                isActive={t.id === themeId}
                isLight={!!isLight}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </>
      )}

      {/* Inline animation keyframes */}
      <style>{`
        @keyframes hf-theme-dropdown-in {
          from { opacity: 0; transform: translateY(${variant === 'floating' ? '8px' : '-8px'}); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/**
 * Individual theme option row
 */
function ThemeOption({
  theme,
  isActive,
  isLight,
  onSelect,
}: {
  theme: ThemeConfig;
  isActive: boolean;
  isLight: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(theme.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '8px 10px',
        background: isActive
          ? (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)')
          : 'transparent',
        border: 'none',
        borderRadius: '8px',
        color: 'var(--hf-text, #e0e0e0)',
        cursor: 'pointer',
        fontSize: '0.82rem',
        fontWeight: isActive ? 600 : 400,
        fontFamily: "'Inter', sans-serif",
        textAlign: 'left',
        transition: 'background 0.12s ease',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
        }
      }}
    >
      {/* Color swatch */}
      <span
        style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: theme.accent,
          flexShrink: 0,
          border: `2px solid ${theme.isLight ? 'var(--hf-border-secondary, #ddd)' : 'color-mix(in srgb, var(--hf-text) 15%, transparent)'}`,
          boxShadow: isActive ? `0 0 8px ${theme.accent}` : 'none',
        }}
      />

      {/* Name */}
      <span style={{ flex: 1 }}>{theme.name}</span>

      {/* Active checkmark */}
      {isActive && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}

      {/* Light mode indicator */}
      {theme.isLight && (
        <span style={{ fontSize: '0.65rem', opacity: 0.5, marginLeft: '-4px' }}>☀</span>
      )}
    </button>
  );
}
