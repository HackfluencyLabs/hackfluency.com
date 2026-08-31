import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/withTimeout';
import { t } from '../../i18n/translations';
import './auth.css';

function getLocale(): 'es' | 'en' {
  if (typeof window === 'undefined') return 'es';
  return window.location.pathname.startsWith('/en') ? 'en' : 'es';
}

function Login() {
  const locale = getLocale();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: `${window.location.origin}/dashboards`,
          },
        }),
        8000
      );

      if (error) throw error;

      setEmailSent(true);
    } catch (err: unknown) {
      if (import.meta.env.DEV) console.error('Login error:', err);
      if (err instanceof Error && err.name === 'TimeoutError') {
        setError(t('login.networkTimeout', locale));
      } else {
        setError(err instanceof Error ? err.message : t('login.failed', locale));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <div className="auth-logo">
            <img src="/HFNeon.webp" alt="Hackfluency" />
            <span className="auth-logo-text">
              <span className="logo-hack">Hack</span>
              <span className="logo-fluency">fluency</span>
            </span>
          </div>
          <h1 className="auth-title">{t('login.title', locale)}</h1>
          {emailSent ? (
            <p className="auth-subtitle" style={{ color: 'var(--hf-accent, #00D26A)' }}>
              {t('login.magicSent', locale)}
            </p>
          ) : (
            <p className="auth-subtitle">
              {t('login.subtitle', locale)}
            </p>
          )}
        </header>

        {error && (
          <div className="auth-alert error">
            {error}
          </div>
        )}

        {emailSent ? (
          <div className="auth-success-state">
            <div className="success-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--hf-accent, #00D26A)" strokeWidth="1.5">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </div>
            <p className="success-message">
              {t('login.sentTo', locale)} <strong>{email}</strong>.
            </p>
            <p className="success-instruction">
              {t('login.sentInstructions', locale)}
            </p>
            <button 
              className="auth-back-button"
              onClick={() => {
                setEmailSent(false);
                setError(null);
              }}
            >
              {t('login.useDifferent', locale)}
            </button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleMagicLink}>
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-label">{t('login.emailLabel', locale)}</label>
              <input
                type="email"
                id="email"
                className="auth-input"
                placeholder={t('login.emailPlaceholder', locale)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? <div className="spinner-small" /> : t('login.sendLink', locale)}
            </button>
            
            <div className="auth-divider">
              <span>{t('login.or', locale)}</span>
            </div>
            
            <a href="/SecurityRoadmap.HF" className="auth-button-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
              </svg>
              {t('login.viewRoadmap', locale)}
            </a>
          </form>
        )}
      </div>
    </div>
  );
}

export default Login;

