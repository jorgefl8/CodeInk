export function initResizeHandle() {
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
