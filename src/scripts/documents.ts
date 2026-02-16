import { getAllDocs, getDoc, saveDoc, deleteDoc } from "@/lib/db"

const MAX_TITLE_LENGTH = 20

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return "Just now"
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
  return new Date(ts).toLocaleDateString()
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len).trim() + "..."
}

function escapeHtml(str: string): string {
  const div = document.createElement("div")
  div.textContent = str
  return div.innerHTML
}

function buildCardHtml(doc: { id: string; title: string; customTitle?: string; content: string; updatedAt: number }): string {
  const displayTitle = doc.customTitle || doc.title
  const preview = truncate(doc.content.replace(/#+\s+/g, "").replace(/\n/g, " "), 100)
  const time = formatRelativeTime(doc.updatedAt)
  return `
    <div class="doc-card-wrapper group relative" data-doc-id="${escapeHtml(doc.id)}">
      <a href="/editor#${escapeHtml(doc.id)}" class="corner-accent doc-card">
        <span class="corner-accent-inner doc-card-inner">
          <h3 class="doc-title font-semibold text-foreground truncate mb-1">${escapeHtml(displayTitle)}</h3>
          <p class="text-xs text-muted-foreground line-clamp-2 mb-3">${escapeHtml(preview)}</p>
          <span class="text-xs text-muted-foreground/70">${escapeHtml(time)}</span>
        </span>
      </a>
      <button type="button" class="doc-rename" aria-label="Rename">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
      </button>
      <button type="button" class="doc-delete" aria-label="Delete">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
      </button>
    </div>
  `
}

function showEmptyState(grid: HTMLElement, emptyState: HTMLElement) {
  grid.classList.add("hidden")
  emptyState.classList.remove("hidden")
  emptyState.classList.add("flex")
}

function showGrid(grid: HTMLElement, emptyState: HTMLElement) {
  grid.classList.remove("hidden")
  emptyState.classList.add("hidden")
  emptyState.classList.remove("flex")
}

async function renderDocs(grid: HTMLElement, emptyState: HTMLElement) {
  const docs = await getAllDocs()

  if (docs.length === 0) {
    showEmptyState(grid, emptyState)
    return
  }

  showGrid(grid, emptyState)
  grid.innerHTML = docs.map(buildCardHtml).join("")
}

function getDocIdFromEvent(e: Event): string | null {
  const wrapper = (e.target as HTMLElement).closest(".doc-card-wrapper")
  return wrapper?.getAttribute("data-doc-id") ?? null
}

function handleRename(wrapper: HTMLElement, id: string, rerender: () => void) {
  const h3 = wrapper.querySelector(".doc-title") as HTMLElement
  if (!h3) return

  const currentTitle = h3.textContent || ""
  const input = document.createElement("input")
  input.type = "text"
  input.value = currentTitle
  input.maxLength = MAX_TITLE_LENGTH
  input.className = "doc-rename-input"
  input.size = Math.max(currentTitle.length, 1)

  h3.replaceWith(input)
  input.focus()
  input.select()

  input.addEventListener("input", () => {
    input.size = Math.max(input.value.length, 1)
  })

  let saved = false

  async function commit() {
    if (saved) return
    saved = true
    const newTitle = input.value.trim().slice(0, MAX_TITLE_LENGTH)
    const doc = await getDoc(id)
    if (doc) {
      doc.customTitle = newTitle || undefined
      await saveDoc(doc)
    }
    rerender()
  }

  function cancel() {
    if (saved) return
    saved = true
    rerender()
  }

  input.addEventListener("keydown", (ke) => {
    if (ke.key === "Enter") {
      ke.preventDefault()
      commit()
    } else if (ke.key === "Escape") {
      ke.preventDefault()
      cancel()
    }
  })
  input.addEventListener("blur", () => commit())
}

async function handleDelete(id: string, rerender: () => void) {
  if (!confirm("Delete this document?")) return
  await deleteDoc(id)
  rerender()
}

function setupEventDelegation(grid: HTMLElement, rerender: () => void) {
  grid.addEventListener("click", (e) => {
    const target = e.target as HTMLElement

    const renameBtn = target.closest(".doc-rename")
    if (renameBtn) {
      e.preventDefault()
      e.stopPropagation()
      const id = getDocIdFromEvent(e)
      const wrapper = target.closest(".doc-card-wrapper") as HTMLElement
      if (id && wrapper) handleRename(wrapper, id, rerender)
      return
    }

    const deleteBtn = target.closest(".doc-delete")
    if (deleteBtn) {
      e.preventDefault()
      e.stopPropagation()
      const id = getDocIdFromEvent(e)
      if (id) handleDelete(id, rerender)
    }
  })
}

export function initDocuments() {
  const grid = document.getElementById("doc-grid")
  const emptyState = document.getElementById("empty-state")
  if (!grid || !emptyState) return

  const rerender = () => renderDocs(grid, emptyState)

  setupEventDelegation(grid, rerender)
  rerender()
}
