export type ViewMode = "split" | "editor" | "preview"

export function createViewModeController(editorRoot: HTMLElement) {
  const viewEditorBtn = document.getElementById("view-editor")
  const viewSplitBtn = document.getElementById("view-split")
  const viewPreviewBtn = document.getElementById("view-preview")

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

  function bindEvents(signal: AbortSignal) {
    viewEditorBtn?.addEventListener("click", () => setViewMode("editor"), { signal })
    viewSplitBtn?.addEventListener("click", () => setViewMode("split"), { signal })
    viewPreviewBtn?.addEventListener("click", () => setViewMode("preview"), { signal })
  }

  return { setViewMode, bindEvents }
}
