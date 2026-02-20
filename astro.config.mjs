// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';
import pwa from '@vite-pwa/astro';

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
        page !== 'https://codeink.app/documents' &&
        page !== 'https://codeink.app/offline/' &&
        page !== 'https://codeink.app/offline',
    }),
    pwa({
      registerType: "autoUpdate",
      injectRegister: false,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectManifest: {
        globIgnores: ["**/_worker.js/**"],
      },
      manifest: {
        name: "CodeInk",
        short_name: "CodeInk",
        description: "Free online Markdown editor with real-time preview, Mermaid diagrams, and KaTeX math support.",
        start_url: "/editor",
        scope: "/",
        display: "standalone",
        theme_color: "#0f1115",
        background_color: "#0f1115",
        icons: [
          {
            src: "/favicon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/favicon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: [
        "mermaid",
        "workbox-window",
        "workbox-core",
        "workbox-expiration",
        "workbox-precaching",
        "workbox-routing",
        "workbox-strategies",
      ],
    },
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
