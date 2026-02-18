// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://codeink.app',
  output: 'server',
  adapter: cloudflare({
    imageService: 'compile',
  }),
  session: {
    driver: 'memory',
  },
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
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return

            if (
              id.includes("@codemirror/") ||
              id.includes("/codemirror/")
            ) {
              return "vendor-codemirror"
            }

            if (
              id.includes("/marked/") ||
              id.includes("marked-alert") ||
              id.includes("marked-footnote") ||
              id.includes("marked-gfm-heading-id") ||
              id.includes("marked-katex-extension")
            ) {
              return "vendor-marked"
            }

            if (
              id.includes("/remark-") ||
              id.includes("/unified/") ||
              id.includes("unist-util-visit")
            ) {
              return "vendor-remark"
            }
          },
        },
      },
    },
  },
});
