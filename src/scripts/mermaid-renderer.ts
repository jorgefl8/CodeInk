import mermaid from "mermaid"

let resizeObserver: ResizeObserver | null = null
let initialized = false

function isContainerVisible(container: HTMLElement): boolean {
  return container.offsetWidth > 0 && container.offsetHeight > 0
}

function watchForVisibility(container: HTMLElement) {
  if (resizeObserver) return

  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        renderMermaidDiagrams(container)
      }
    }
  })

  resizeObserver.observe(container)
}

export function initMermaid(container: HTMLElement) {
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      gantt: {
        useMaxWidth: true,
        rightPadding: 75,
        leftPadding: 75,
        barHeight: 25,
        barGap: 4,
      },
    })
    initialized = true
  }

  window.addEventListener("mermaid-rerender", () => renderMermaidDiagrams(container))
}

export async function renderMermaidDiagrams(container: HTMLElement) {
  await new Promise((resolve) => setTimeout(resolve, 50))

  const unprocessedDivs = container.querySelectorAll(".mermaid:not([data-processed])")
  if (!unprocessedDivs.length) return

  if (!isContainerVisible(container)) {
    watchForVisibility(container)
    return
  }

  try {
    const containerWidth = container.getBoundingClientRect().width
    for (const node of Array.from(unprocessedDivs) as HTMLElement[]) {
      const source = node.textContent?.trimStart() ?? ""
      const isGantt = /^gantt\b/i.test(source)
      if (isGantt) {
        node.classList.add("mermaid--gantt")
      } else {
        node.classList.remove("mermaid--gantt")
      }

      const parentWidth = node.parentElement?.getBoundingClientRect().width
      const targetWidth = parentWidth && parentWidth > 0 ? parentWidth : containerWidth
      if (isGantt && targetWidth > 0) {
        node.style.width = `${Math.floor(targetWidth)}px`
      } else {
        node.style.removeProperty("width")
      }
    }
    await mermaid.run({
      nodes: Array.from(unprocessedDivs) as HTMLElement[],
      suppressErrors: true,
    })
  } catch (error) {
    console.error("[Mermaid] Rendering error:", error)
  }
}
