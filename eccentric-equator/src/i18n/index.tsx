import { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { t as translate, type Language } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hf-language');
      if (saved === 'en' || saved === 'es') return saved;
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('es')) return 'es';
    }
    return 'es';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hf-language', lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string): string => {
    return translate(key, language);
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useI18n();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '12px', color: 'var(--cti-text-muted, rgba(255,255,255,0.7))' }}>{t('language')}:</span>
      <button
        onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
        style={{
          background: 'var(--cti-bg-card, rgba(255,255,255,0.1))',
          border: '1px solid var(--cti-border, rgba(255,255,255,0.2))',
          borderRadius: '6px',
          padding: '4px 10px',
          color: 'var(--cti-text-secondary, #fff)',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s',
        }}
      >
        <span>{language === 'en' ? '🇺🇸' : '🇪🇸'}</span>
        <span>{language === 'en' ? 'EN' : 'ES'}</span>
      </button>
    </div>
  );
};

export default { I18nProvider, useI18n, LanguageSwitcher };
