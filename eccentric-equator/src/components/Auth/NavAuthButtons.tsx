import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';
import './auth.css';

interface NavAuthButtonsProps {
  mobile?: boolean;
}

const BOOKING_URL = 'https://hackfluency.zohobookings.com/#/hackfluency';

const NavAuthButtons: React.FC<NavAuthButtonsProps> = ({ mobile = false }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
        <a href={BOOKING_URL} target="_blank" rel="noopener" className="nav-cta">Book a Call</a>
      </>
    );
  }

  if (mobile) {
    if (!session) {
      return (
        <>
          <a href="/dashboards" className="mobile-nav-btn-signin">Sign In</a>
          <a href={BOOKING_URL} target="_blank" rel="noopener" className="mobile-nav-cta">Book a Call</a>
        </>
      );
    }
    return (
      <>
        <a href="/cti/" className="mobile-nav-btn-threat">Threat Intelligence</a>
        <a href="/dashboards" className="mobile-nav-btn-platform">Dashboards</a>
        <button onClick={handleLogout} className="mobile-nav-btn-logout">Log Out</button>
        <a href={BOOKING_URL} target="_blank" rel="noopener" className="mobile-nav-cta">Book a Call</a>
      </>
    );
  }

  // Desktop
  if (!session) {
    return (
      <>
        <a href="/dashboards" className="nav-btn-dashboard">Sign In</a>
        <a href={BOOKING_URL} target="_blank" rel="noopener" className="nav-cta">Book a Call</a>
      </>
    );
  }

  return (
    <>
      <a href="/cti/" className="nav-btn-threat">Threat Intel</a>
      <a href="/dashboards" className="nav-btn-dashboard">Dashboards</a>
      <button onClick={handleLogout} className="nav-btn-logout">Log Out</button>
      <a href={BOOKING_URL} target="_blank" rel="noopener" className="nav-cta">Book a Call</a>
    </>
  );
};

export default NavAuthButtons;
