// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.hackfluency.com',
  base: '/',
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'es',
        locales: {
          es: 'es-ES',
          en: 'en-US',
        },
      },
      serialize: (entry) => /** @type {import('@astrojs/sitemap').SitemapItem} */ ({
        ...entry,
        changefreq: entry.changefreq ?? 'monthly',
        priority: entry.priority ?? 0.5,
        lastmod: entry.lastmod ?? new Date().toISOString().split('T')[0],
      }),
    }),
  ],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
