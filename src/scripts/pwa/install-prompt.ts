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
const IOS_INSTALL_HINT_ID = "codeink-ios-install-hint"

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  )
}

function isIOSBrowser() {
  const ua = window.navigator.userAgent
  const iOSDevice = /iPad|iPhone|iPod/.test(ua)
  const iPadOSDesktopMode = /Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1

  return iOSDevice || iPadOSDesktopMode
}

function canShowIOSInstallHelp(w: WindowWithInstallState) {
  return isIOSBrowser() && !w.__codeinkPwaInstalled
}

function hideIOSInstallHint() {
  const hint = document.getElementById(IOS_INSTALL_HINT_ID)
  if (!hint) return
  hint.style.display = "none"
}

function ensureIOSInstallHint() {
  const existing = document.getElementById(IOS_INSTALL_HINT_ID)
  if (existing) return existing

  const overlay = document.createElement("div")
  overlay.id = IOS_INSTALL_HINT_ID
  overlay.setAttribute("role", "dialog")
  overlay.setAttribute("aria-modal", "true")
  overlay.setAttribute("aria-label", "Install CodeInk on iOS")
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "10000",
    display: "none",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "16px",
    background: "rgba(0, 0, 0, 0.45)",
  })

  const panel = document.createElement("div")
  Object.assign(panel.style, {
    width: "min(520px, 100%)",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--foreground)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
    padding: "16px",
    fontFamily: "var(--font-sans)",
  })

  const title = document.createElement("h3")
  title.textContent = "Install on iPhone / iPad"
  Object.assign(title.style, {
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "600",
  })

  const description = document.createElement("p")
  description.textContent = "To install CodeInk on iOS:"
  Object.assign(description.style, {
    margin: "0 0 10px 0",
    color: "var(--muted-foreground)",
    fontSize: "14px",
  })

  const list = document.createElement("ol")
  Object.assign(list.style, {
    margin: "0",
    paddingLeft: "20px",
    display: "grid",
    gap: "6px",
    fontSize: "14px",
    lineHeight: "1.4",
  })

  const step1 = document.createElement("li")
  step1.textContent = "Open the browser menu or Share action."
  const step2 = document.createElement("li")
  step2.textContent = "Tap 'Add to Home Screen'."
  const step3 = document.createElement("li")
  step3.textContent = "Confirm with 'Add'."
  list.append(step1, step2, step3)

  const note = document.createElement("p")
  note.textContent = "If you do not see the option, try opening this page in Safari."
  Object.assign(note.style, {
    margin: "10px 0 14px 0",
    color: "var(--muted-foreground)",
    fontSize: "12px",
  })

  const closeBtn = document.createElement("button")
  closeBtn.type = "button"
  closeBtn.textContent = "Got it"
  Object.assign(closeBtn.style, {
    border: "1px solid color-mix(in srgb, var(--primary) 35%, transparent)",
    background: "color-mix(in srgb, var(--primary) 10%, transparent)",
    color: "var(--foreground)",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "500",
  })

  closeBtn.addEventListener("click", hideIOSInstallHint)
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) hideIOSInstallHint()
  })

  panel.append(title, description, list, note, closeBtn)
  overlay.append(panel)
  document.body.appendChild(overlay)

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideIOSInstallHint()
  })

  return overlay
}

function showIOSInstallHint() {
  const hint = ensureIOSInstallHint()
  hint.style.display = "flex"
}

function syncInstallButtons() {
  const w = window as WindowWithInstallState
  const canInstall =
    !w.__codeinkPwaInstalled &&
    (Boolean(w.__codeinkDeferredInstallPrompt) || canShowIOSInstallHelp(w))

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
    if (w.__codeinkPwaInstalled) return

    if (deferred) {
      button.disabled = true
      await deferred.prompt()
      await deferred.userChoice

      w.__codeinkDeferredInstallPrompt = null
      syncInstallButtons()
      return
    }

    if (canShowIOSInstallHelp(w)) showIOSInstallHint()
    syncInstallButtons()
  })

  document.addEventListener("astro:after-swap", syncInstallButtons)
  document.addEventListener("astro:page-load", syncInstallButtons)
  syncInstallButtons()
}
