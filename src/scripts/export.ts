import { getEditorContent } from "@/scripts/codemirror-setup"

export function setupMarkdownExport(signal: AbortSignal) {
  const exportMdBtn = document.getElementById("export-md")
  if (!exportMdBtn) return

  exportMdBtn.addEventListener("click", () => {
    const content = getEditorContent()
    const titleMatch = content.match(/^#\s+(.+)$/m)
    const title = titleMatch ? titleMatch[1].trim() : "document"
    const sanitized = title.replace(/[^a-z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc\u00f1\s-]/gi, "").replace(/\s+/g, "-")
    const filename = `${sanitized}.md`

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, { signal })
}
