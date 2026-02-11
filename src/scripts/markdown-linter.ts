import type { Diagnostic } from "@codemirror/lint"
import type { EditorView } from "@codemirror/view"

// Define action interface inline since DiagnosticAction is not exported
interface QuickFixAction {
  name: string
  apply(view: EditorView, from: number, to: number): void
}

interface LinterState {
  inFencedCode: boolean
  fenceToken: string
  inCodeSpan: boolean
  firstListMarker: string | null
  consecutiveBlanks: number
  prevHeadingLevel: number
}

function createInitialState(): LinterState {
  return {
    inFencedCode: false,
    fenceToken: "",
    inCodeSpan: false,
    firstListMarker: null,
    consecutiveBlanks: 0,
    prevHeadingLevel: 0,
  }
}

function isInsideCodeBlock(line: string, state: LinterState): boolean {
  // Check for fenced code block markers
  const fenceMatch = line.match(/^(```+|~~~+)(\w*)/)
  if (fenceMatch) {
    if (!state.inFencedCode) {
      state.inFencedCode = true
      state.fenceToken = fenceMatch[1]
    } else if (line.trim() === state.fenceToken) {
      state.inFencedCode = false
      state.fenceToken = ""
    }
    return true
  }
  return state.inFencedCode
}

function isInsideInlineCode(text: string, index: number): boolean {
  // Count backticks before this position
  let backtickCount = 0
  for (let i = 0; i < index; i++) {
    if (text[i] === '`') {
      // Check if it's escaped
      let escapeCount = 0
      for (let j = i - 1; j >= 0 && text[j] === '\\'; j--) {
        escapeCount++
      }
      if (escapeCount % 2 === 0) {
        backtickCount++
      }
    }
  }
  return backtickCount % 2 !== 0
}

function createHeadingFixAction(level: number): QuickFixAction {
  return {
    name: "Add space",
    apply(view: EditorView, from: number, to: number) {
      const hashMarks = "#".repeat(level)
      view.dispatch({
        changes: { from, to: from + level, insert: `${hashMarks} ` }
      })
    }
  }
}

function createRemoveTrailingSpacesAction(): QuickFixAction {
  return {
    name: "Remove trailing spaces",
    apply(view: EditorView, from: number, to: number) {
      view.dispatch({
        changes: { from, to, insert: "" }
      })
    }
  }
}

function createCollapseBlanksAction(): QuickFixAction {
  return {
    name: "Remove extra blank line",
    apply(view: EditorView, from: number, to: number) {
      view.dispatch({
        changes: { from, to: to + 1, insert: "\n" }
      })
    }
  }
}

export function markdownLint(view: EditorView): Diagnostic[] {
  const doc = view.state.doc
  const diagnostics: Diagnostic[] = []
  const state = createInitialState()

  for (let i = 1; i <= doc.lines; i++) {
    const lineObj = doc.line(i)
    const line = lineObj.text
    const from = lineObj.from
    const to = lineObj.to

    // Track fenced code blocks
    if (isInsideCodeBlock(line, state)) {
      state.consecutiveBlanks = 0
      continue
    }

    // Skip if we're inside inline code at the start of line
    if (isInsideInlineCode(doc.toString(), from)) {
      state.consecutiveBlanks = 0
      continue
    }

    // --- heading-space: missing space after # ---
    // Check: starts with 1-6 #, followed immediately by non-whitespace (not space/tab)
    // Valid:   "## Heading"  -> ## + space + H
    // Invalid: "##Heading"   -> ## + H (missing space)
    const headingMatch = line.match(/^(#{1,6})(.+)$/)
    if (headingMatch) {
      const hashes = headingMatch[1]
      const afterHashes = headingMatch[2]
      
      // Check if there's no space/tab after the hashes
      // and the content after hashes is not empty
      if (afterHashes.length > 0 && !afterHashes.match(/^[ \t]/)) {
        diagnostics.push({
          from,
          to: from + hashes.length + 1,
          severity: "warning",
          message: "Missing space after heading marker",
          actions: [createHeadingFixAction(hashes.length)]
        })
      }
    }

    // --- no-empty-heading: heading with no content ---
    // Match # followed by only whitespace or nothing until end
    const emptyHeading = line.match(/^(#{1,6})\s*$/)
    if (emptyHeading) {
      diagnostics.push({
        from,
        to,
        severity: "error",
        message: "Empty heading has no content",
      })
    }

    // --- heading-increment: no skipping levels ---
    // Only check valid headings (with space after #)
    const validHeading = line.match(/^(#{1,6})\s+\S/)
    if (validHeading) {
      const level = validHeading[1].length
      if (state.prevHeadingLevel > 0 && level > state.prevHeadingLevel + 1) {
        diagnostics.push({
          from,
          to: from + validHeading[1].length,
          severity: "warning",
          message: `Heading level skipped: expected h${state.prevHeadingLevel + 1} or lower, found h${level}`,
        })
      }
      state.prevHeadingLevel = level
    }

    // --- no-trailing-spaces ---
    const trailingMatch = line.match(/[ \t]+$/)
    if (trailingMatch) {
      const trailFrom = to - trailingMatch[0].length
      diagnostics.push({
        from: trailFrom,
        to,
        severity: "info",
        message: "Trailing whitespace",
        actions: [createRemoveTrailingSpacesAction()]
      })
    }

    // --- no-multiple-blanks ---
    if (line.trim() === "") {
      state.consecutiveBlanks++
      if (state.consecutiveBlanks > 1) {
        diagnostics.push({
          from,
          to: Math.max(to, from + 1),
          severity: "info",
          message: "Multiple consecutive blank lines",
          actions: [createCollapseBlanksAction()]
        })
      }
    } else {
      state.consecutiveBlanks = 0
    }

    // --- consistent-list-marker ---
    // Check for list items (unordered lists)
    const listMatch = line.match(/^(\s*)([-*+])\s/)
    if (listMatch) {
      const marker = listMatch[2]
      const indent = listMatch[1].length
      
      // Only enforce consistency at the same indentation level
      if (indent === 0) {
        if (state.firstListMarker === null) {
          state.firstListMarker = marker
        } else if (marker !== state.firstListMarker) {
          const markerOffset = from + listMatch[1].length
          diagnostics.push({
            from: markerOffset,
            to: markerOffset + 1,
            severity: "warning",
            message: `Inconsistent list marker: expected '${state.firstListMarker}', found '${marker}'`,
          })
        }
      }
    }
  }

  // --- fenced-code-closing: unclosed fence ---
  if (state.inFencedCode) {
    diagnostics.push({
      from: doc.length - 1,
      to: doc.length,
      severity: "error",
      message: "Unclosed fenced code block",
    })
  }

  return diagnostics
}

export function fixMarkdown(text: string): string {
  const lines = text.split("\n")
  const result: string[] = []
  
  let state = createInitialState()

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Track fenced code blocks - never modify inside them
    const fenceMatch = line.match(/^(```+|~~~+)(\w*)/)
    if (fenceMatch) {
      if (!state.inFencedCode) {
        state.inFencedCode = true
        state.fenceToken = fenceMatch[1]
      } else if (line.trim() === state.fenceToken) {
        state.inFencedCode = false
        state.fenceToken = ""
      }
      result.push(line)
      state.consecutiveBlanks = 0
      continue
    }

    // Don't touch lines inside code blocks
    if (state.inFencedCode) {
      result.push(line)
      state.consecutiveBlanks = 0
      continue
    }

    // Skip if we're inside inline code at the start of line
    const textSoFar = result.join("\n") + (result.length > 0 ? "\n" : "") + line
    if (isInsideInlineCode(textSoFar, textSoFar.length - line.length)) {
      result.push(line)
      state.consecutiveBlanks = 0
      continue
    }

    // no-trailing-spaces: trim trailing whitespace
    line = line.replace(/[ \t]+$/, "")

    // heading-space: add space after # if missing (but only for actual headings)
    // Only fix if: it's at start of line, has 1-6 #, and next char is not space/tab
    if (/^#{1,6}\S/.test(line)) {
      line = line.replace(/^(#{1,6})(\S)/, "$1 $2")
    }

    // no-empty-heading: skip lines that are just # with no content
    if (/^#{1,6}\s*$/.test(line)) {
      state.consecutiveBlanks = 0
      continue
    }

    // no-multiple-blanks: collapse consecutive blank lines
    if (line.trim() === "") {
      if (state.consecutiveBlanks > 0) continue
      state.consecutiveBlanks++
      result.push(line)
      continue
    }
    state.consecutiveBlanks = 0

    // consistent-list-marker: normalize to first marker found
    const listMatch = line.match(/^(\s*)([-*+])(\s)/)
    if (listMatch) {
      const marker = listMatch[2]
      const indent = listMatch[1].length
      
      // Only normalize at root level (no indentation)
      if (indent === 0) {
        if (state.firstListMarker === null) {
          state.firstListMarker = marker
        } else if (marker !== state.firstListMarker) {
          line = listMatch[1] + state.firstListMarker + listMatch[3] + line.slice(listMatch[0].length)
        }
      }
    }

    result.push(line)
  }

  // fenced-code-closing: close unclosed fence
  if (state.inFencedCode) {
    result.push(state.fenceToken)
  }

  return result.join("\n")
}