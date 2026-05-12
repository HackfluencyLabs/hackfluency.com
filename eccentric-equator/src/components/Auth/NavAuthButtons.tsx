import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { t } from '../../i18n/translations';
import './auth.css';

interface NavAuthButtonsProps {
  mobile?: boolean;
}

const BOOKING_URL = 'https://hackfluency.zohobookings.com/#/hackfluency';

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
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

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

  // While loading, render skeleton to avoid CLS
  if (loading) {
    if (mobile) return null;
    return (
      <>
        <div style={{ width: '70px', height: '36px', borderRadius: '8px', background: 'color-mix(in srgb, var(--hf-text) 4%, transparent)' }} />
        <a href={BOOKING_URL} target="_blank" rel="noopener" className="nav-cta">{t('common.bookCall', locale)}</a>
      </>
    );
  }

  if (mobile) {
    if (!session) {
      return (
        <>
          <a href={localePath('/dashboards')} className="mobile-nav-btn-signin">{t('nav.signIn', locale)}</a>
          <a href={BOOKING_URL} target="_blank" rel="noopener" className="mobile-nav-cta">{t('common.bookCall', locale)}</a>
        </>
      );
    }
    return (
      <>
        <a href={localePath('/cti/')} className="mobile-nav-btn-threat">{t('nav.threatIntel', locale)}</a>
        <a href={localePath('/dashboards')} className="mobile-nav-btn-platform">{t('nav.dashboards', locale)}</a>
        <button onClick={handleLogout} className="mobile-nav-btn-logout">{t('nav.logOut', locale)}</button>
        <a href={BOOKING_URL} target="_blank" rel="noopener" className="mobile-nav-cta">{t('common.bookCall', locale)}</a>
      </>
    );
  }

  // Desktop — not logged in
  if (!session) {
    return (
      <>
        <a href={localePath('/dashboards')} className="nav-btn-dashboard">{t('nav.signIn', locale)}</a>
        <a href={BOOKING_URL} target="_blank" rel="noopener" className="nav-cta">{t('common.bookCall', locale)}</a>
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
      <a href={BOOKING_URL} target="_blank" rel="noopener" className="nav-cta">{t('common.bookCall', locale)}</a>
    </>
  );
};

export default NavAuthButtons;
