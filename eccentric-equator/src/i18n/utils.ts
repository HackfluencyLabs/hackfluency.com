import { t as translate, type Language } from './translations';

export function getLocale(url: URL): Language {
  const path = url.pathname;
  if (path.startsWith('/en/') || path === '/en') return 'en';
  return 'es';
}

export function getTranslations(locale: Language) {
  return {
    t: (key: string) => translate(key, locale),
    locale,
    isDefault: locale === 'es',
  };
}

export function localizePath(path: string, locale: Language): string {
  if (locale === 'es') return path;
  if (path === '/') return '/en';
  return `/en${path}`;
}
