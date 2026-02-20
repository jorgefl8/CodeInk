function getLintIcon(type: "error" | "success"): string {
  if (type === "error") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`
}

function estimateTokens(content: string): number {
  // Approximate token count: ~4 chars per token on average
  // More accurate than simple word count for LLM tokens
  if (!content) return 0
  return Math.ceil(content.length / 4)
}

export function updateStatusBar(content: string) {
  const lines = content.split("\n").length
  const words = content.trim() ? content.trim().split(/\s+/).length : 0
  const chars = content.length
  const tokens = estimateTokens(content)

  // Update popup stats (visible in Info button popup)
  const infoLines = document.getElementById("info-lines")?.querySelector(".info-stat-value")
  const infoWords = document.getElementById("info-words")?.querySelector(".info-stat-value")
  const infoChars = document.getElementById("info-chars")?.querySelector(".info-stat-value")
  const infoTokens = document.getElementById("info-tokens")?.querySelector(".info-stat-value")
  if (infoLines) infoLines.textContent = String(lines)
  if (infoWords) infoWords.textContent = String(words)
  if (infoChars) infoChars.textContent = String(chars)
  if (infoTokens) infoTokens.textContent = String(tokens)
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
  function setFixButtonVisible(visible: boolean) {
    if (!fixBtn) return
    if (visible) {
      fixBtn.classList.remove("hidden")
      fixBtn.classList.add("inline-flex")
    } else {
      fixBtn.classList.add("hidden")
      fixBtn.classList.remove("inline-flex")
    }
  }

  return function updateLintStatus(count: number) {
    if (!lintEl) return
    const countEl = lintEl.querySelector(".lint-count")
    const svg = lintEl.querySelector("svg")!
    const normalizedCount = Number.isFinite(count) ? count : 0

    if (normalizedCount > 0) {
      lintEl.classList.add("has-issues")
      lintEl.classList.remove("no-issues")
      svg.outerHTML = getLintIcon("error")
      if (countEl) countEl.textContent = `${normalizedCount} issue${normalizedCount === 1 ? "" : "s"}`
      setFixButtonVisible(true)
    } else {
      lintEl.classList.remove("has-issues")
      lintEl.classList.add("no-issues")
      svg.outerHTML = getLintIcon("success")
      if (countEl) countEl.textContent = "0 issues"
      setFixButtonVisible(false)
    }
  }
}
