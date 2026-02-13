// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://code-ink.florencloud.com',
  integrations: [
    sitemap({
      filter: (page) =>
        page !== 'https://code-ink.florencloud.com/editor/' &&
        page !== 'https://code-ink.florencloud.com/editor',
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});