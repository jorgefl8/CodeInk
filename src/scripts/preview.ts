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
      try {
        const html = await renderMarkdown(content)
        target.innerHTML = html
        await renderMermaidDiagrams(target)
        if (cleanupCopy) cleanupCopy()
        cleanupCopy = initCopyButtons(target)
      } catch (err) {
        console.error("[CodeInk] Preview render error:", err)
      }
    }, DEBOUNCE_MS)
  }

  window.addEventListener("editor-change", handleEditorChange as EventListener)

  return () => {
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
