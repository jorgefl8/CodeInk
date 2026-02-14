import mermaid from "mermaid"

let resizeObserver: ResizeObserver | null = null

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

  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
  })

  try {
    await mermaid.run({
      nodes: Array.from(unprocessedDivs) as HTMLElement[],
      suppressErrors: true,
    })
  } catch (error) {
    console.error("[Mermaid] Rendering error:", error)
  }
}
