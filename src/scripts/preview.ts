import { renderMarkdown } from "@/lib/markdown"
import { renderMermaidDiagrams } from "@/scripts/mermaid-renderer"
import { initCopyButtons } from "@/scripts/copy-handler"

const DEBOUNCE_MS = 300

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let cleanupCopy: (() => void) | null = null

export function initPreview(target: HTMLElement) {
  const handleEditorChange = (e: CustomEvent<{ content: string }>) => {
    const content = e.detail.content

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      debounceTimer = null
      await renderPreview(content, target)
    }, DEBOUNCE_MS)
  }

  // Intercept footnote anchor clicks to scroll within preview instead of changing URL hash
  const handleAnchorClick = (e: MouseEvent) => {
    const link = (e.target as HTMLElement).closest("a[href^='#']")
    if (!link) return
    e.preventDefault()
    const id = (link as HTMLAnchorElement).getAttribute("href")!.slice(1)
    const targetEl = target.querySelector(`[id="${id}"]`)
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }

  target.addEventListener("click", handleAnchorClick)
  window.addEventListener("editor-change", handleEditorChange as EventListener)

  return () => {
    target.removeEventListener("click", handleAnchorClick)
    window.removeEventListener("editor-change", handleEditorChange as EventListener)
    if (debounceTimer) clearTimeout(debounceTimer)
    if (cleanupCopy) cleanupCopy()
  }
}

export async function renderPreview(content: string, target: HTMLElement) {
  try {
    const html = await renderMarkdown(content)
    target.innerHTML = html
    await renderMermaidDiagrams(target)
    if (cleanupCopy) cleanupCopy()
    cleanupCopy = initCopyButtons(target)
  } catch (err) {
    console.error("[CodeInk] Preview render error:", err)
  }
}
