function getLintIcon(type: "error" | "success"): string {
  if (type === "error") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
}

export function updateStatusBar(content: string) {
  const lines = content.split("\n").length
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const chars = content.length

  const linesEl = document.getElementById("status-lines")
  const wordsEl = document.getElementById("status-words")
  const charsEl = document.getElementById("status-chars")

  const mobile = window.innerWidth < 640
  const lLabel = mobile ? "l" : "lines"
  const wLabel = mobile ? "w" : "words"
  const cLabel = mobile ? "c" : "chars"

  if (linesEl) linesEl.innerHTML = linesEl.querySelector("svg")!.outerHTML + ` ${lines} ${lLabel}`
  if (wordsEl) wordsEl.innerHTML = wordsEl.querySelector("svg")!.outerHTML + ` ${words} ${wLabel}`
  if (charsEl) charsEl.innerHTML = charsEl.querySelector("svg")!.outerHTML + ` ${chars} ${cLabel}`
}

export function setupSaveStateManager(saveEl: HTMLElement | null, saveLabel: Element | null | undefined) {
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

export function setupLintStatusManager(lintEl: HTMLElement | null, fixBtn: HTMLElement | null) {
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
