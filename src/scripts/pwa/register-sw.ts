import { registerSW } from "virtual:pwa-register"

type WindowWithPWAState = Window & {
  __codeinkSwInit?: boolean
}

export function registerCodeinkServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return

  const w = window as WindowWithPWAState
  if (w.__codeinkSwInit) return
  w.__codeinkSwInit = true

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new Event("codeink-pwa-update-available"))
    },
    onOfflineReady() {
      window.dispatchEvent(new Event("codeink-pwa-offline-ready"))
    },
    onRegisterError(error) {
      console.error("[CodeInk] Service worker registration failed", error)
    },
  })

  window.addEventListener("codeink-pwa-apply-update", () => {
    updateSW(true)
  })
}

