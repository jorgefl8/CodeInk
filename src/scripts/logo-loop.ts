const SMOOTH_TAU = 0.25

function initLogoLoop(root: HTMLElement) {
  const track = root.querySelector<HTMLDivElement>(".logo-loop-track")
  const seq = root.querySelector<HTMLElement>(".logo-loop-measure")
  if (!track || !seq) return

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

  function measure() {
    seqWidth = seq!.getBoundingClientRect().width
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
    measure()
    if (prefersReduced) {
      track!.style.transform = "translate3d(0, 0, 0)"
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
    new ResizeObserver(measure).observe(root)
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
