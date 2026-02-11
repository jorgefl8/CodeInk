import { createEditor, destroyEditor, getEditorContent, setEditorContent } from "@/scripts/codemirror-setup"
import { fixMarkdown } from "@/scripts/markdown-linter"
import { initPreview, renderPreview } from "@/scripts/preview"
import { initMermaid } from "@/scripts/mermaid-renderer"
import {
  getDoc,
  saveDoc,
  extractTitle,
  type Document,
} from "@/lib/db"
import DEFAULT_MARKDOWN from "@/lib/default-markdown.md?raw"

let editorAbort: AbortController | null = null
const AUTO_SAVE_DEBOUNCE_MS = 1000
type ViewMode = "split" | "editor" | "preview"

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

function getLintIcon(type: "error" | "success"): string {
  if (type === "error") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
}

async function createNewDocument(): Promise<{ docId: string; createdAt: number }> {
  const docId = crypto.randomUUID()
  const now = Date.now()
  const doc: Document = {
    id: docId,
    title: extractTitle(DEFAULT_MARKDOWN),
    content: DEFAULT_MARKDOWN,
    createdAt: now,
    updatedAt: now,
  }
  await saveDoc(doc)
  window.history.replaceState(null, "", `/editor#${docId}`)
  return { docId, createdAt: now }
}

async function loadExistingDocument(docId: string): Promise<{ content: string; createdAt: number; customTitle?: string } | null> {
  const existing = await getDoc(docId)
  if (!existing) return null
  return {
    content: existing.content,
    createdAt: existing.createdAt,
    customTitle: existing.customTitle,
  }
}

function setupSaveStateManager(saveEl: HTMLElement | null, saveLabel: Element | null | undefined) {
  return function setSaveState(state: "idle" | "saving" | "saved") {
    if (!saveEl || !saveLabel) return
    saveEl.classList.remove("saving", "saved")
    if (state === "saving") {
      saveEl.classList.add("saving")
      saveLabel.textContent = "Saving..."
    } else if (state === "saved") {
      saveEl.classList.add("saved")
      saveLabel.textContent = "Saved locally"
      setTimeout(() => saveEl.classList.remove("saved"), 1500)
    } else {
      saveLabel.textContent = "Saved locally"
    }
  }
}

function setupLintStatusManager(lintEl: HTMLElement | null, fixBtn: HTMLElement | null) {
  return function updateLintStatus(count: number) {
    if (!lintEl) return
    const countEl = lintEl.querySelector(".lint-count")
    const svg = lintEl.querySelector("svg")!
    
    if (count > 0) {
      lintEl.classList.add("has-issues")
      lintEl.classList.remove("no-issues")
      svg.outerHTML = getLintIcon("error")
      if (countEl) countEl.textContent = `${count} issue${count === 1 ? "" : "s"}`
      fixBtn?.classList.remove("hidden")
    } else {
      lintEl.classList.remove("has-issues")
      lintEl.classList.add("no-issues")
      svg.outerHTML = getLintIcon("success")
      if (countEl) countEl.textContent = "0 issues"
      fixBtn?.classList.add("hidden")
    }
  }
}

function setupAutoSave(
  docId: string,
  createdAt: number,
  customTitle: string | undefined,
  setSaveState: (state: "idle" | "saving" | "saved") => void,
  signal: AbortSignal
): () => void {
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null
  
  const handleChange = ((e: CustomEvent<{ content: string }>) => {
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
        ...(customTitle ? { customTitle } : {}),
        content,
        createdAt,
        updatedAt: now,
      }
      await saveDoc(doc)
      setSaveState("saved")
    }, AUTO_SAVE_DEBOUNCE_MS)
  }) as EventListener

  window.addEventListener("editor-change", handleChange, { signal })
  
  return () => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
  }
}

function setupMarkdownExport(signal: AbortSignal) {
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

async function initializeEditor(
  cmMount: HTMLElement,
  previewEl: HTMLElement,
  editorRoot: HTMLElement,
  initialContent: string
) {
  createEditor(cmMount, initialContent)
  initPreview(previewEl)
  initMermaid(previewEl)
  initResizeHandle()
  await renderPreview(initialContent, previewEl)
  updateStatusBar(initialContent)
  editorRoot.classList.add("loaded")
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

  async function loadAndInit() {
    const hash = window.location.hash.replace("#", "")
    let docId = hash && hash !== "new" ? hash : ""
    let initialContent = DEFAULT_MARKDOWN
    let createdAt = Date.now()
    let customTitle: string | undefined

    if (!docId) {
      const newDoc = await createNewDocument()
      docId = newDoc.docId
      createdAt = newDoc.createdAt
    } else {
      const existing = await loadExistingDocument(docId)
      if (existing) {
        initialContent = existing.content
        createdAt = existing.createdAt
        customTitle = existing.customTitle
      }
    }

    if (editorRoot && cmMount && previewEl) {
      await initializeEditor(cmMount, previewEl, editorRoot, initialContent)
    }

    const saveEl = document.getElementById("status-save")
    const saveLabel = saveEl?.querySelector(".save-label")
    const setSaveState = setupSaveStateManager(saveEl, saveLabel)

    const lintEl = document.getElementById("status-lint")
    const fixBtn = document.getElementById("lint-fix")
    const updateLintStatus = setupLintStatusManager(lintEl, fixBtn)

    updateLintStatus(0)

    window.addEventListener("lint-update", ((e: CustomEvent<{ count: number }>) => {
      updateLintStatus(e.detail.count)
    }) as EventListener, { signal })

    fixBtn?.addEventListener("click", () => {
      const content = getEditorContent()
      const fixed = fixMarkdown(content)
      if (fixed !== content) setEditorContent(fixed)
    }, { signal })

    const cleanupAutoSave = setupAutoSave(docId, createdAt, customTitle, setSaveState, signal)
    signal.addEventListener("abort", cleanupAutoSave)
  }

  loadAndInit()

  function setViewMode(mode: ViewMode) {
    if (!editorRoot) return
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

  setupMarkdownExport(signal)

  setViewMode("split")
}