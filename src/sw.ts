/// <reference lib="WebWorker" />

import { clientsClaim } from "workbox-core"
import { ExpirationPlugin } from "workbox-expiration"
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching"
import { registerRoute } from "workbox-routing"
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from "workbox-strategies"

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>
}

const OFFLINE_URLS = ["/offline", "/editor", "/documents", "/"]
const APP_SHELL_CACHE = "codeink-app-shell-v1"
const NAVIGATION_CACHE = "codeink-navigation-v1"
const ASSET_CACHE = "codeink-assets-v1"
const IMAGE_CACHE = "codeink-images-v1"
const FONT_CACHE = "codeink-fonts-v1"

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
self.skipWaiting()
clientsClaim()

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE)
      await cache.addAll(OFFLINE_URLS)
    })(),
  )
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

const navigationStrategy = new NetworkFirst({
  cacheName: NAVIGATION_CACHE,
  networkTimeoutSeconds: 3,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 7,
    }),
  ],
})

registerRoute(
  ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin,
  async ({ event, request }) => {
    try {
      return await navigationStrategy.handle({ event, request })
    } catch {
      const cache = await caches.open(APP_SHELL_CACHE)
      return (
        (await cache.match(request, { ignoreSearch: true })) ||
        (await cache.match("/offline")) ||
        (await cache.match("/editor")) ||
        Response.error()
      )
    }
  },
)

registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (request.destination === "script" ||
      request.destination === "style" ||
      request.destination === "worker"),
  new StaleWhileRevalidate({
    cacheName: ASSET_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
)

registerRoute(
  ({ request, url }) => url.origin === self.location.origin && request.destination === "font",
  new CacheFirst({
    cacheName: FONT_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
    ],
  }),
)

registerRoute(
  ({ request, url }) => url.origin === self.location.origin && request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: IMAGE_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
)

