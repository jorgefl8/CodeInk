const SMOOTH_TAU = 0.25
const COVERAGE_MULTIPLIER = 2

function initLogoLoop(root: HTMLElement) {
  if (root.dataset.logoLoopReady === "true") return
  root.dataset.logoLoopReady = "true"

  const trackNode = root.querySelector<HTMLDivElement>(".logo-loop-track")
  const seqNode = root.querySelector<HTMLElement>(".logo-loop-measure")
  if (!trackNode || !seqNode) return
  const track = trackNode
  const seq = seqNode

  const prefersReduced =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

  const speed = parseFloat(root.dataset.speed ?? "80")
  const dir = root.dataset.direction ?? "left"
  const shouldPause = root.dataset.pause === "true"
  const targetSpeed = dir === "left" ? speed : -speed

  let velocity = 0
  let offset = 0
  let seqWidth = 0
  let hovered = false
  let lastTs: number | null = null
  let raf: number | null = null
  let resizeRaf: number | null = null

  function measure() {
    seqWidth = seq.getBoundingClientRect().width
  }

  function clearClones() {
    track.querySelectorAll<HTMLElement>("[data-logo-loop-clone]").forEach((clone) => clone.remove())
  }

  function buildClones() {
    measure()
    clearClones()
    if (seqWidth <= 0) return

    const rootWidth = root.getBoundingClientRect().width
    const requiredWidth = Math.max(rootWidth * COVERAGE_MULTIPLIER, seqWidth * 2)
    let totalWidth = seqWidth

    while (totalWidth < requiredWidth) {
      const clone = seq.cloneNode(true) as HTMLElement
      clone.dataset.logoLoopClone = "true"
      clone.setAttribute("aria-hidden", "true")
      clone.querySelectorAll<HTMLAnchorElement>("a").forEach((link) => {
        link.tabIndex = -1
      })
      track.append(clone)
      totalWidth += seqWidth
    }
  }

  function scheduleRebuild() {
    if (resizeRaf !== null) return
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null
      buildClones()
      if (seqWidth > 0) {
        offset = (((offset % seqWidth) + seqWidth) % seqWidth) || 0
      } else {
        offset = 0
      }
    })
  }

  function animate(ts: number) {
    if (lastTs === null) lastTs = ts
    const dt = Math.max(0, ts - lastTs) / 1000
    lastTs = ts

    const target = hovered ? 0 : targetSpeed
    const ease = 1 - Math.exp(-dt / SMOOTH_TAU)
    velocity += (target - velocity) * ease

    if (seqWidth > 0) {
      offset = (((offset + velocity * dt) % seqWidth) + seqWidth) % seqWidth
      track!.style.transform = `translate3d(${-offset}px, 0, 0)`
    }

    raf = requestAnimationFrame(animate)
  }

  function start() {
    buildClones()
    if (prefersReduced) {
      track.style.transform = "translate3d(0, 0, 0)"
      return
    }
    if (!raf) raf = requestAnimationFrame(animate)
  }

  const imgs = seq.querySelectorAll("img")
  let pending = imgs.length

  if (pending === 0) {
    requestAnimationFrame(() => start())
  } else {
    const onLoad = () => {
      if (--pending === 0) start()
    }
    imgs.forEach((img) => {
      if ((img as HTMLImageElement).complete) {
        onLoad()
      } else {
        img.addEventListener("load", onLoad, { once: true })
        img.addEventListener("error", onLoad, { once: true })
      }
    })
  }

  if (window.ResizeObserver) {
    new ResizeObserver(scheduleRebuild).observe(root)
  } else {
    window.addEventListener("resize", scheduleRebuild, { passive: true })
  }

  if (shouldPause) {
    track.addEventListener("mouseenter", () => {
      hovered = true
    })
    track.addEventListener("mouseleave", () => {
      hovered = false
    })
  }
}

export function initAllLogoLoops() {
  document.querySelectorAll<HTMLElement>(".logo-loop").forEach(initLogoLoop)
}
