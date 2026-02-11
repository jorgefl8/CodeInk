import { getAllDocs, deleteDoc } from "@/lib/db"

const HAS_DOCS_KEY = "codeink-has-docs"

export function setHasDocuments(value: boolean) {
  localStorage.setItem(HAS_DOCS_KEY, value ? "1" : "")
}

export function hasDocuments(): boolean {
  return localStorage.getItem(HAS_DOCS_KEY) === "1"
}

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

async function renderDocs() {
  const grid = document.getElementById("doc-grid")
  const emptyState = document.getElementById("empty-state")
  if (!grid || !emptyState) return

  const docs = await getAllDocs()

  if (docs.length === 0) {
    setHasDocuments(false)
    grid.classList.add("hidden")
    emptyState.classList.remove("hidden")
    emptyState.classList.add("flex")
    return
  }

  setHasDocuments(true)
  grid.classList.remove("hidden")
  emptyState.classList.add("hidden")
  emptyState.classList.remove("flex")

  grid.innerHTML = docs.map((doc) => {
    const preview = truncate(doc.content.replace(/#+\s+/g, "").replace(/\n/g, " "), 100)
    const time = formatRelativeTime(doc.updatedAt)
    return `
      <div class="doc-card-wrapper group relative" data-doc-id="${escapeHtml(doc.id)}">
        <a href="/editor#${escapeHtml(doc.id)}" class="corner-accent doc-card">
          <span class="corner-accent-inner doc-card-inner">
            <h3 class="font-semibold text-foreground truncate mb-1">${escapeHtml(doc.title)}</h3>
            <p class="text-xs text-muted-foreground line-clamp-2 mb-3">${escapeHtml(preview)}</p>
            <span class="text-xs text-muted-foreground/70">${escapeHtml(time)}</span>
          </span>
        </a>
        <button type="button" class="doc-delete" aria-label="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </button>
      </div>
    `
  }).join("")

  grid.querySelectorAll(".doc-delete").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault()
      e.stopPropagation()
      const wrapper = (e.target as HTMLElement).closest(".doc-card-wrapper")
      const id = wrapper?.getAttribute("data-doc-id")
      if (!id || !confirm("Delete this document?")) return
      await deleteDoc(id)
      renderDocs()
    })
  })
}

export function initDocuments() {
  if (document.getElementById("documents-root")) {
    renderDocs()
  }
}
