import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/withTimeout';
import type { Session } from '@supabase/supabase-js';
import { t } from '../../i18n/translations';
import './auth.css';

interface NavAuthButtonsProps {
  mobile?: boolean;
}

function getContactUrl(): string {
  if (typeof window === 'undefined') return '/#contact';
  return window.location.pathname.startsWith('/en') ? '/en#contact' : '/#contact';
}

function getLocale(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'es';
  return window.location.pathname.startsWith('/en') ? 'en' : 'es';
}

function localePath(path: string): string {
  const locale = getLocale();
  if (locale === 'es') return path;
  return `/en${path}`;
}

const NavAuthButtons: React.FC<NavAuthButtonsProps> = ({ mobile = false }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();

  // No getSession() on mount: the home page never pokes Supabase for
  // anonymous visitors. Only the reactive listener is kept (it reads
  // local storage, no network), so a logged-in user still gets their
  // dropdown immediately on navigation.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Lazy session check: only runs when the user actually clicks
  // "Iniciar Sesión". With a timeout so a paused/unreachable Supabase
  // never hangs the click — we fall back to the login page.
  const handleSignIn = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      const { data } = await withTimeout(supabase.auth.getSession(), 3000);
      if (data.session) {
        setSession(data.session);
        setMenuOpen(true);
        return;
      }
    } catch {
      // Supabase unreachable — fall through to the login page below.
    }
    window.location.href = localePath('/dashboards');
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Click outside to close dropdown
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', onEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [menuOpen, handleClickOutside]);

  function onEscape(e: KeyboardEvent) {
    if (e.key === 'Escape') setMenuOpen(false);
  }

  if (mobile) {
    if (!session) {
      return (
        <>
          <a href={localePath('/dashboards')} className="mobile-nav-btn-signin" onClick={handleSignIn}>{t('nav.signIn', locale)}</a>
          <a href={getContactUrl()} className="mobile-nav-cta" style={{color: '#ffffff'}}>{t('common.bookCall', locale)}</a>
        </>
      );
    }
    return (
      <>
        <a href={localePath('/cti/')} className="mobile-nav-btn-threat">{t('nav.threatIntel', locale)}</a>
        <a href={localePath('/dashboards')} className="mobile-nav-btn-platform">{t('nav.dashboards', locale)}</a>
        <button onClick={handleLogout} className="mobile-nav-btn-logout">{t('nav.logOut', locale)}</button>
        <a href={getContactUrl()} className="mobile-nav-cta" style={{color: '#ffffff'}}>{t('common.bookCall', locale)}</a>
      </>
    );
  }

  // Desktop — not logged in
  if (!session) {
    return (
      <>
        <a href={localePath('/dashboards')} className="nav-btn-dashboard" onClick={handleSignIn}>{t('nav.signIn', locale)}</a>
        <a href={getContactUrl()} className="nav-cta" style={{color: '#ffffff'}}>{t('common.bookCall', locale)}</a>
      </>
    );
  }

  // Desktop — logged in: dropdown menu
  return (
    <>
      <div className="nav-dropdown" ref={menuRef}>
        <button
          className="nav-dropdown-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={t('nav.account', locale)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4"/>
            <path d="M20 21a8 8 0 1 0-16 0"/>
          </svg>
          <span className="nav-dropdown-label">{t('nav.accountLabel', locale)}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`nav-dropdown-chevron ${menuOpen ? 'open' : ''}`} aria-hidden="true">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {menuOpen && (
          <div className="nav-dropdown-menu">
            <a href={localePath('/cti/')} className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {t('nav.threatIntel', locale)}
            </a>
            <a href={localePath('/dashboards')} className="nav-dropdown-item" onClick={() => setMenuOpen(false)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="9" width="7" height="12" rx="1"/></svg>
              {t('nav.dashboards', locale)}
            </a>
            <div className="nav-dropdown-divider" />
            <button onClick={handleLogout} className="nav-dropdown-item nav-dropdown-item--danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              {t('nav.logOut', locale)}
            </button>
          </div>
        )}
      </div>
      <a href={getContactUrl()} className="nav-cta" style={{color: '#ffffff'}}>{t('common.bookCall', locale)}</a>
    </>
  );
};

export default NavAuthButtons;
