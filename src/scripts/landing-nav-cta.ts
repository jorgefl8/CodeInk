export function initLandingNavCta() {
  const heroCta = document.getElementById("hero-cta")
  const heroBtn = heroCta?.querySelector("a.corner-accent") as HTMLElement | null
  const navCta = document.getElementById("nav-cta")

  if (!heroCta || !heroBtn || !navCta) return

  let lastHeroRect = { top: 0, left: 0, width: 0, height: 0 }
  let isInNav = false
  let flyClone: HTMLElement | null = null
  let observer: IntersectionObserver | null = null
  let hasClickListeners = false
  const scrollOptions: AddEventListenerOptions = { passive: true }

  function cleanup() {
    flyClone?.remove()
    flyClone = null
    window.removeEventListener("scroll", captureHeroRect, scrollOptions)
    observer?.disconnect()
    observer = null
    if (hasClickListeners) {
      heroBtn.removeEventListener("click", handleNavigationClick)
      navCta.removeEventListener("click", handleNavigationClick)
      hasClickListeners = false
    }
    if (navCta) {
      navCta.style.transition = "none"
      navCta.classList.remove("visible")
      navCta.offsetHeight
      navCta.style.transition = ""
    }
    isInNav = false
  }

  document.addEventListener("astro:before-preparation", cleanup)

  function handleNavigationClick(event: MouseEvent) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    cleanup()
  }

  function captureHeroRect() {
    const r = heroBtn!.getBoundingClientRect()
    if (r.bottom > 0 && r.top < window.innerHeight) {
      lastHeroRect = { top: r.top, left: r.left, width: r.width, height: r.height }
    }
  }

  captureHeroRect()
  window.addEventListener("scroll", captureHeroRect, scrollOptions)
  heroBtn.addEventListener("click", handleNavigationClick)
  navCta.addEventListener("click", handleNavigationClick)
  hasClickListeners = true

  observer = new IntersectionObserver(([entry]) => {
    if (flyClone) return

    if (!entry.isIntersecting && !isInNav) {
      const from = lastHeroRect
      const to = navCta.getBoundingClientRect()

      const scaleX = to.width / from.width
      const scaleY = to.height / from.height
      const fromCX = from.left + from.width / 2
      const fromCY = from.top + from.height / 2
      const toCX = to.left + to.width / 2
      const toCY = to.top + to.height / 2
      const dx = toCX - fromCX
      const dy = toCY - fromCY

      flyClone = heroBtn!.cloneNode(true) as HTMLElement
      flyClone.removeAttribute("id")
      Object.assign(flyClone.style, {
        position: "fixed",
        zIndex: "9999",
        top: `${from.top}px`,
        left: `${from.left}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
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
}
