import { createEditor, destroyEditor } from "@/scripts/codemirror-setup"
import { initPreview, renderPreview } from "@/scripts/preview"
import { initMermaid } from "@/scripts/mermaid-renderer"
import {
  getDoc,
  saveDoc,
  extractTitle,
  type Document,
} from "@/lib/db"
import { setHasDocuments } from "@/scripts/documents"

let editorAbort: AbortController | null = null

const DEFAULT_MARKDOWN = `# Welcome to CodeInk

A real-time **Markdown editor** with syntax highlighting, diagrams, and math.

---

## Code Highlighting

\`\`\`typescript
interface User {
  id: string
  name: string
  email: string
}

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`)
  if (!res.ok) throw new Error("User not found")
  return res.json()
}
\`\`\`

\`\`\`python
def fibonacci(n: int) -> list[int]:
    """Generate fibonacci sequence"""
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

print(fibonacci(10))
\`\`\`

## Mermaid Diagrams

\`\`\`mermaid
graph TD
    A[Write Markdown] --> B[Live Preview]
    B --> C{Looks good?}
    C -->|Yes| D[Share it!]
    C -->|No| A
\`\`\`

## Math with KaTeX

Inline math: $E = mc^2$

Block math:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## GitHub Alerts

> [!TIP]
> Use keyboard shortcuts to speed up your workflow.

> [!WARNING]
> This is a client-side only application. Your content is not saved to any server.

> [!NOTE]
> CodeInk supports all GitHub Flavored Markdown features.

## Tables

| Feature | Status |
|---------|--------|
| Syntax Highlighting | Shiki |
| Diagrams | Mermaid |
| Math | KaTeX |
| Alerts | GitHub-style |
| Footnotes | Supported |

## Task List

- [x] Markdown rendering
- [x] Shiki syntax highlighting
- [x] Mermaid diagrams
- [x] KaTeX math
- [ ] Export to PDF
- [ ] Collaborative editing

## Footnotes

CodeInk uses marked[^1] for parsing and Shiki[^2] for syntax highlighting.

[^1]: [marked](https://marked.js.org/) - A markdown parser built for speed.
[^2]: [Shiki](https://shiki.style/) - A beautiful syntax highlighter.
`

type ViewMode = "split" | "editor" | "preview"

const AUTO_SAVE_DEBOUNCE_MS = 1000

function updateStatusBar(content: string) {
  const lines = content.split("\n").length
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const chars = content.length

  const linesEl = document.getElementById("status-lines")
  const wordsEl = document.getElementById("status-words")
  const charsEl = document.getElementById("status-chars")

  if (linesEl) linesEl.innerHTML = linesEl.querySelector("svg")!.outerHTML + ` ${lines} lines`
  if (wordsEl) wordsEl.innerHTML = wordsEl.querySelector("svg")!.outerHTML + ` ${words} words`
  if (charsEl) charsEl.innerHTML = charsEl.querySelector("svg")!.outerHTML + ` ${chars} chars`
}

function initResizeHandle() {
  const handle = document.getElementById("resize-handle")
  const editorPane = document.getElementById("editor-pane")
  const previewPane = document.getElementById("preview-pane")
  if (!handle || !editorPane || !previewPane) return

  let isResizing = false
  let startX = 0
  let startEditorWidth = 0

  handle.addEventListener("mousedown", (e: MouseEvent) => {
    isResizing = true
    startX = e.clientX
    startEditorWidth = editorPane.getBoundingClientRect().width
    handle.classList.add("dragging")
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    e.preventDefault()
  })

  document.addEventListener("mousemove", (e: MouseEvent) => {
    if (!isResizing) return
    const parent = editorPane.parentElement
    if (!parent) return
    const parentWidth = parent.getBoundingClientRect().width
    const delta = e.clientX - startX
    const newWidth = startEditorWidth + delta
    const minWidth = 200
    const maxWidth = parentWidth - 200

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      const pct = (newWidth / parentWidth) * 100
      editorPane.style.flex = "none"
      editorPane.style.width = `${pct}%`
      previewPane.style.flex = "1"
    }
  })

  document.addEventListener("mouseup", () => {
    if (!isResizing) return
    isResizing = false
    handle.classList.remove("dragging")
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  })
}

export function initEditor() {
  if (editorAbort) editorAbort.abort()
  editorAbort = new AbortController()
  const { signal } = editorAbort

  destroyEditor()

  const editorRoot = document.getElementById("editor-root")
  const cmMount = document.getElementById("cm-editor")
  const previewEl = document.getElementById("preview")
  const viewEditorBtn = document.getElementById("view-editor")
  const viewSplitBtn = document.getElementById("view-split")
  const viewPreviewBtn = document.getElementById("view-preview")

  if (!editorRoot || !cmMount || !previewEl) {
    console.error("[CodeInk] Missing required DOM elements")
    return
  }

  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

  async function loadAndInit() {
    const hash = window.location.hash.replace("#", "")
    let docId = hash && hash !== "new" ? hash : ""
    let initialContent = DEFAULT_MARKDOWN
    let createdAt = Date.now()

    if (!docId) {
      docId = crypto.randomUUID()
      const now = Date.now()
      const doc: Document = {
        id: docId,
        title: extractTitle(DEFAULT_MARKDOWN),
        content: DEFAULT_MARKDOWN,
        createdAt: now,
        updatedAt: now,
      }
      await saveDoc(doc)
      setHasDocuments(true)
      createdAt = now
      window.history.replaceState(null, "", `/editor#${docId}`)
    } else {
      const existing = await getDoc(docId)
      if (existing) {
        initialContent = existing.content
        createdAt = existing.createdAt
      }
    }

    createEditor(cmMount, initialContent)
    initPreview(previewEl)
    initMermaid(previewEl)
    initResizeHandle()

    renderPreview(initialContent, previewEl)
    updateStatusBar(initialContent)

    const saveEl = document.getElementById("status-save")
    const saveLabel = saveEl?.querySelector(".save-label")

    function setSaveState(state: "idle" | "saving" | "saved") {
      if (!saveEl || !saveLabel) return
      saveEl.classList.remove("saving", "saved")
      if (state === "saving") {
        saveEl.classList.add("saving")
        saveLabel.textContent = "Saving..."
      } else if (state === "saved") {
        saveEl.classList.add("saved")
        saveLabel.textContent = "Saved locally"
        setTimeout(() => {
          saveEl.classList.remove("saved")
        }, 1500)
      } else {
        saveLabel.textContent = "Saved locally"
      }
    }

    window.addEventListener("editor-change", ((e: CustomEvent<{ content: string }>) => {
      const content = e.detail.content
      updateStatusBar(content)
      setSaveState("saving")

      if (autoSaveTimer) clearTimeout(autoSaveTimer)
      autoSaveTimer = setTimeout(async () => {
        autoSaveTimer = null
        const now = Date.now()
        const doc: Document = {
          id: docId,
          title: extractTitle(content),
          content,
          createdAt,
          updatedAt: now,
        }
        await saveDoc(doc)
        setSaveState("saved")
      }, AUTO_SAVE_DEBOUNCE_MS)
    }) as EventListener, { signal })
  }

  loadAndInit()

  function setViewMode(mode: ViewMode) {
    editorRoot.setAttribute("data-view", mode)
    viewEditorBtn?.classList.toggle("active", mode === "editor")
    viewSplitBtn?.classList.toggle("active", mode === "split")
    viewPreviewBtn?.classList.toggle("active", mode === "preview")

    const editorPane = document.getElementById("editor-pane")
    if (editorPane) {
      editorPane.style.flex = ""
      editorPane.style.width = ""
    }
  }

  viewEditorBtn?.addEventListener("click", () => setViewMode("editor"), { signal })
  viewSplitBtn?.addEventListener("click", () => setViewMode("split"), { signal })
  viewPreviewBtn?.addEventListener("click", () => setViewMode("preview"), { signal })

  setViewMode("split")
}
