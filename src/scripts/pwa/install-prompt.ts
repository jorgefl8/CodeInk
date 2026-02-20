interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

type WindowWithInstallState = Window & {
  __codeinkInstallPromptInit?: boolean
  __codeinkDeferredInstallPrompt?: BeforeInstallPromptEvent | null
  __codeinkPwaInstalled?: boolean
}

const INSTALL_SELECTOR = "[data-pwa-install-btn]"

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  )
}

function syncInstallButtons() {
  const w = window as WindowWithInstallState
  const canInstall = Boolean(w.__codeinkDeferredInstallPrompt) && !w.__codeinkPwaInstalled

  document.querySelectorAll(INSTALL_SELECTOR).forEach((el) => {
    const btn = el as HTMLButtonElement
    btn.hidden = !canInstall
    btn.disabled = !canInstall
  })
}

export function initPwaInstallPrompt() {
  const w = window as WindowWithInstallState
  if (w.__codeinkInstallPromptInit) {
    syncInstallButtons()
    return
  }

  w.__codeinkInstallPromptInit = true
  w.__codeinkPwaInstalled = isInstalled()
  w.__codeinkDeferredInstallPrompt = null

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    w.__codeinkDeferredInstallPrompt = event as BeforeInstallPromptEvent
    syncInstallButtons()
  })

  window.addEventListener("appinstalled", () => {
    w.__codeinkPwaInstalled = true
    w.__codeinkDeferredInstallPrompt = null
    syncInstallButtons()
  })

  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement | null
    const button = target?.closest(INSTALL_SELECTOR) as HTMLButtonElement | null
    if (!button) return

    const deferred = w.__codeinkDeferredInstallPrompt
    if (!deferred || w.__codeinkPwaInstalled) return

    button.disabled = true
    await deferred.prompt()
    await deferred.userChoice

    w.__codeinkDeferredInstallPrompt = null
    syncInstallButtons()
  })

  document.addEventListener("astro:after-swap", syncInstallButtons)
  document.addEventListener("astro:page-load", syncInstallButtons)
  syncInstallButtons()
}

