export function initCopyButtons(container: HTMLElement) {
  const handleClick = async (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest(".copy-code-btn") as HTMLButtonElement | null
    if (!btn) return

    const codeBlock = btn.closest(".code-block")
    const code = codeBlock?.querySelector("pre code")?.textContent
    if (!code) return

    try {
      await navigator.clipboard.writeText(code)
      btn.setAttribute("data-copied", "true")
      setTimeout(() => btn.removeAttribute("data-copied"), 2000)
    } catch (err) {
      console.error("[CodeInk] Copy failed:", err)
    }
  }

  container.addEventListener("click", handleClick)
  return () => container.removeEventListener("click", handleClick)
}
