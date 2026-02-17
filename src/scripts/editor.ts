import { createEditor, destroyEditor, getEditorContent, setEditorContent } from "@/scripts/codemirror-setup"
import { fixMarkdown } from "@/scripts/markdown-linter"
import { initPreview, renderPreview } from "@/scripts/preview"
import { initMermaid } from "@/scripts/mermaid-renderer"
import { initResizeHandle } from "@/scripts/resize-handle"
import { updateStatusBar, setupSaveStateManager, setupLintStatusManager } from "@/scripts/status-bar"
import { createViewModeController } from "@/scripts/view-mode"
import { setupMarkdownExport } from "@/scripts/export"
import {
  getDoc,
  saveDoc,
  type Document,
} from "@/lib/db"
import { extractTitle } from "@/lib/markdown"
import DEFAULT_MARKDOWN from "@/lib/default-markdown.md?raw"

let editorAbort: AbortController | null = null
const AUTO_SAVE_DEBOUNCE_MS = 1000

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

  if (!editorRoot || !cmMount || !previewEl) {
    console.error("[CodeInk] Missing required DOM elements")
    return
  }

  const viewMode = createViewModeController(editorRoot)

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

  viewMode.bindEvents(signal)
  setupMarkdownExport(signal)

  const isMobile = window.innerWidth < 640
  viewMode.setViewMode(isMobile ? "editor" : "split")
}
