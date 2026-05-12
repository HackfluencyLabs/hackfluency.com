import React, { useState, useEffect } from 'react';
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
    await supabase.auth.signOut();
    window.location.reload();
  };

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

  // Desktop
  if (!session) {
    return (
      <>
        <a href={localePath('/dashboards')} className="nav-btn-dashboard">{t('nav.signIn', locale)}</a>
        <a href={BOOKING_URL} target="_blank" rel="noopener" className="nav-cta">{t('common.bookCall', locale)}</a>
      </>
    );
  }

  return (
    <>
      <a href={localePath('/cti/')} className="nav-btn-threat">{t('nav.threatIntel', locale)}</a>
      <a href={localePath('/dashboards')} className="nav-btn-dashboard">{t('nav.dashboards', locale)}</a>
      <button onClick={handleLogout} className="nav-btn-logout">{t('nav.logOut', locale)}</button>
      <a href={BOOKING_URL} target="_blank" rel="noopener" className="nav-cta">{t('common.bookCall', locale)}</a>
    </>
  );
};

export default NavAuthButtons;
