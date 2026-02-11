import mermaid from "mermaid"

export function initMermaid(container: HTMLElement) {
  window.addEventListener("mermaid-rerender", () => renderMermaidDiagrams(container))
}

export async function renderMermaidDiagrams(container: HTMLElement) {
  await new Promise((resolve) => setTimeout(resolve, 50))

  const unprocessedDivs = container.querySelectorAll(".mermaid:not([data-processed])")
  if (!unprocessedDivs.length) return

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
