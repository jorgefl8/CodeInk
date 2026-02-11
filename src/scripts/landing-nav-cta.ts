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

  let lastHeroRect = { top: 0, left: 0, width: 0, height: 0 }
  let isInNav = false
  let flyClone: HTMLElement | null = null
  let navigating = false

  function cleanup() {
    navigating = true
    flyClone?.remove()
    flyClone = null
    if (navCta) {
      navCta.style.transition = "none"
      navCta.classList.remove("visible")
      navCta.offsetHeight
      navCta.style.transition = ""
    }
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
      // Compensate for CSS zoom on <html> — getBoundingClientRect() returns
      // screen pixels (already zoomed), but position:fixed inside the zoomed
      // container expects layout pixels.
      const zoom = parseFloat(getComputedStyle(document.documentElement).zoom) || 1

      const from = lastHeroRect
      const toRaw = navCta.getBoundingClientRect()

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
        navCta.style.transition = "none"
        navCta.classList.add("visible")
        navCta.offsetHeight
        navCta.style.transition = ""
        flyClone?.remove()
        flyClone = null
        isInNav = true
      }, 470)
    } else if (entry.isIntersecting && isInNav) {
      navCta.classList.remove("visible")
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
    navigating = false
    isInNav = false
  }
}
