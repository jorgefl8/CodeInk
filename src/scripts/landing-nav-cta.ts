let destroy: (() => void) | null = null

export function initLandingNavCta() {
  if (destroy) {
    destroy()
    destroy = null
  }

  const heroCta = document.getElementById("hero-cta")
  const heroBtn = heroCta?.querySelector("a.corner-accent") as HTMLElement | null
  const navCta = document.getElementById("nav-cta")

  if (!heroCta || !heroBtn || !navCta) return
  const navCtaEl = navCta

  let lastHeroRect = { top: 0, left: 0, width: 0, height: 0 }
  let isInNav = false
  let flyClone: HTMLElement | null = null
  let navigating = false
  let hideTimer: number | null = null

  function clearHideTimer() {
    if (hideTimer !== null) {
      window.clearTimeout(hideTimer)
      hideTimer = null
    }
  }

  function showNavCta() {
    clearHideTimer()
    navCtaEl.style.opacity = ""
    navCtaEl.classList.remove("invisible")
    navCtaEl.classList.add("opacity-100")
  }

  function hideNavCta() {
    clearHideTimer()
    navCtaEl.classList.remove("opacity-100")
    hideTimer = window.setTimeout(() => {
      if (!isInNav) navCtaEl.classList.add("invisible")
      hideTimer = null
    }, 300)
  }

  function cleanup() {
    navigating = true
    clearHideTimer()
    flyClone?.remove()
    flyClone = null
    navCtaEl.style.transition = "none"
    navCtaEl.classList.remove("opacity-100")
    navCtaEl.classList.add("invisible")
    navCtaEl.offsetHeight
    navCtaEl.style.transition = ""
    isInNav = false
  }

  document.addEventListener("astro:before-preparation", cleanup)

  function captureHeroRect() {
    const r = heroBtn!.getBoundingClientRect()
    if (r.bottom > 0 && r.top < window.innerHeight) {
      lastHeroRect = { top: r.top, left: r.left, width: r.width, height: r.height }
    }
  }

  captureHeroRect()
  window.addEventListener("scroll", captureHeroRect, { passive: true })

  const observer = new IntersectionObserver(([entry]) => {
    if (flyClone || navigating) return

    if (!entry.isIntersecting && !isInNav) {
      // Skip fly animation on mobile or when hero rect was never captured
      // (e.g. page reloaded while scrolled past the hero)
      if (window.innerWidth < 640 || lastHeroRect.width === 0) {
        showNavCta()
        isInNav = true
        return
      }

      // Compensate for CSS zoom on <html> — getBoundingClientRect() returns
      // screen pixels (already zoomed), but position:fixed inside the zoomed
      // container expects layout pixels.
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1

      const from = lastHeroRect
      const toRaw = navCtaEl.getBoundingClientRect()

      const scaleX = toRaw.width / from.width
      const scaleY = toRaw.height / from.height
      const fromCX = from.left + from.width / 2
      const fromCY = from.top + from.height / 2
      const toCX = toRaw.left + toRaw.width / 2
      const toCY = toRaw.top + toRaw.height / 2
      const dx = (toCX - fromCX) / zoom
      const dy = (toCY - fromCY) / zoom

      flyClone = heroBtn!.cloneNode(true) as HTMLElement
      flyClone.removeAttribute("id")
      Object.assign(flyClone.style, {
        position: "fixed",
        zIndex: "9999",
        top: `${from.top / zoom}px`,
        left: `${from.left / zoom}px`,
        width: `${from.width / zoom}px`,
        height: `${from.height / zoom}px`,
        boxSizing: "border-box",
        margin: "0",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        transformOrigin: "center center",
        transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
      })
      document.body.appendChild(flyClone)
      flyClone.offsetHeight

      flyClone.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`

      setTimeout(() => {
        navCtaEl.style.transition = "none"
        showNavCta()
        navCtaEl.offsetHeight
        navCtaEl.style.transition = ""
        flyClone?.remove()
        flyClone = null
        isInNav = true
      }, 470)
    } else if (entry.isIntersecting && isInNav) {
      hideNavCta()
      isInNav = false
    }
  }, { threshold: 0 })

  observer.observe(heroCta)

  destroy = () => {
    observer.disconnect()
    window.removeEventListener("scroll", captureHeroRect)
    document.removeEventListener("astro:before-preparation", cleanup)
    flyClone?.remove()
    flyClone = null
    clearHideTimer()
    navigating = false
    isInNav = false
  }
}
