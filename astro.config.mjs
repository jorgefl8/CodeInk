// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://codeink.app',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      filter: (page) =>
        page !== 'https://codeink.app/editor/' &&
        page !== 'https://codeink.app/editor' &&
        page !== 'https://codeink.app/documents/' &&
        page !== 'https://codeink.app/documents',
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});