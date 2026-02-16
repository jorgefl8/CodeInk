import { marked, type Token, type Tokens } from "marked"
import markedAlert from "marked-alert"
import markedFootnote from "marked-footnote"
import markedKatex from "marked-katex-extension"
import { gfmHeadingId } from "marked-gfm-heading-id"
import { highlightCode } from "@/lib/shiki/highlight"

let highlightMap = new Map<string, string>()

const LANG_ICON_MAP: Record<string, string> = {
  typescript: "ts",
  javascript: "js",
  tsx: "ts",
  jsx: "js",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  dockerfile: "dockerfile",
  docker: "dockerfile",
}

const renderer = {
  code({ text, lang }: Tokens.Code) {
    if (lang === "mermaid") {
      return `<div class="mermaid">${text}</div>`
    }

    const highlighted = highlightMap.get(text) ?? text
    const label = lang || "text"
    
    // Handle "text" fallback - don't try to load text.svg, use default directly
    const iconLang = label === "text" ? "default" : (LANG_ICON_MAP[label] ?? label)
    const iconPath = `/icons/lang/${iconLang}.svg`
    const fallbackIcon = `/icons/lang/default.svg`

    const LANG_LABEL_MAP: Record<string, string> = {
      js: "Javascript",
      ts: "TypeScript",
      tsx: "React (TS)",
      jsx: "React (JS)",
      sh: "Bash",
      yml: "YAML",
    }

    const displayLabel = LANG_LABEL_MAP[label] ?? label.charAt(0).toUpperCase() + label.slice(1)
    
    // Only show label if it's not the generic "text" fallback
    const showLabel = label !== "text"

    return `
      <div class="code-block group" data-language="${label}">
        <div class="code-block-header">
          <div class="code-block-lang-info">
            <img src="${iconPath}" onerror="this.src='${fallbackIcon}'" width="18" height="18" alt="" class="code-block-lang-icon" />
            ${showLabel ? `<span class="code-block-lang">${displayLabel}</span>` : ""}
          </div>
          <button class="copy-code-btn" type="button" data-copy-code="true" aria-label="Copy code">
            <span class="copy-code-icon copy-code-icon--copy" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </span>
            <span class="copy-code-icon copy-code-icon--check" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
          </button>
        </div>
        ${highlighted}
      </div>
    `
  },
}

marked.use(
  markedAlert(),
  markedFootnote(),
  markedKatex({ throwOnError: false }),
  gfmHeadingId(),
  {
    renderer,
    async: true,
    async walkTokens(token: Token) {
      if (token.type === "code") {
        const codeToken = token as Tokens.Code
        if (codeToken.lang !== "mermaid") {
          const html = await highlightCode(codeToken.text, codeToken.lang)
          highlightMap.set(codeToken.text, html)
        }
      }
    },
  },
)

export function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : "Untitled"
}

export async function renderMarkdown(content: string): Promise<string> {
  highlightMap = new Map()
  const result = await marked.parse(content)
  highlightMap = new Map()
  return result
}
