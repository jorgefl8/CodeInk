import type { Diagnostic } from "@codemirror/lint"
import type { EditorView } from "@codemirror/view"

interface QuickFixAction {
  name: string
  apply(view: EditorView, from: number, to: number): void
}

interface LinterState {
  inFencedCode: boolean
  fenceToken: string
  firstListMarker: string | null
  consecutiveBlanks: number
  prevHeadingLevel: number
}

function createQuickFixAction(name: string, applyFn: (view: EditorView, from: number, to: number) => void): QuickFixAction {
  return { name, apply: applyFn }
}

function isInsideCodeBlock(line: string, state: LinterState): boolean {
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
  let backtickCount = 0
  for (let i = 0; i < index; i++) {
    if (text[i] === '`' && (i === 0 || text[i - 1] !== '\\')) {
      backtickCount++
    }
  }
  return backtickCount % 2 !== 0
}

export function markdownLint(view: EditorView): Diagnostic[] {
  const doc = view.state.doc
  const diagnostics: Diagnostic[] = []
  const state: LinterState = {
    inFencedCode: false,
    fenceToken: "",
    firstListMarker: null,
    consecutiveBlanks: 0,
    prevHeadingLevel: 0,
  }

  for (let i = 1; i <= doc.lines; i++) {
    const lineObj = doc.line(i)
    const line = lineObj.text
    const from = lineObj.from
    const to = lineObj.to

    if (isInsideCodeBlock(line, state)) {
      state.consecutiveBlanks = 0
      continue
    }

    if (isInsideInlineCode(doc.toString(), from)) {
      state.consecutiveBlanks = 0
      continue
    }

    const headingMatch = line.match(/^(#{1,6})(.+)$/)
    if (headingMatch) {
      const hashes = headingMatch[1]
      const afterHashes = headingMatch[2]
      
      if (afterHashes.length > 0 && !afterHashes.match(/^[ \t]/)) {
        diagnostics.push({
          from,
          to: from + hashes.length + 1,
          severity: "warning",
          message: "Missing space after heading marker",
          actions: [createQuickFixAction("Add space", (view, from, to) => {
            view.dispatch({
              changes: { from, to: from + hashes.length, insert: `${hashes} ` }
            })
          })]
        })
      }
    }

    if (/^#{1,6}\s*$/.test(line)) {
      diagnostics.push({
        from,
        to,
        severity: "error",
        message: "Empty heading has no content",
      })
    }

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

    const trailingMatch = line.match(/[ \t]+$/)
    if (trailingMatch) {
      const trailFrom = to - trailingMatch[0].length
      diagnostics.push({
        from: trailFrom,
        to,
        severity: "info",
        message: "Trailing whitespace",
        actions: [createQuickFixAction("Remove trailing spaces", (view, from, to) => {
          view.dispatch({ changes: { from, to, insert: "" } })
        })]
      })
    }

    if (line.trim() === "") {
      state.consecutiveBlanks++
      if (state.consecutiveBlanks > 1) {
        diagnostics.push({
          from,
          to: Math.max(to, from + 1),
          severity: "info",
          message: "Multiple consecutive blank lines",
          actions: [createQuickFixAction("Remove extra blank line", (view, from, to) => {
            view.dispatch({ changes: { from, to: to + 1, insert: "\n" } })
          })]
        })
      }
    } else {
      state.consecutiveBlanks = 0
    }

    const listMatch = line.match(/^(\s*)([-*+])\s/)
    if (listMatch) {
      const marker = listMatch[2]
      const indent = listMatch[1].length
      
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
  
  const state: LinterState = {
    inFencedCode: false,
    fenceToken: "",
    firstListMarker: null,
    consecutiveBlanks: 0,
    prevHeadingLevel: 0,
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

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

    if (state.inFencedCode) {
      result.push(line)
      state.consecutiveBlanks = 0
      continue
    }

    const textSoFar = result.join("\n") + (result.length > 0 ? "\n" : "") + line
    if (isInsideInlineCode(textSoFar, textSoFar.length - line.length)) {
      result.push(line)
      state.consecutiveBlanks = 0
      continue
    }

    line = line.replace(/[ \t]+$/, "")

    if (/^#{1,6}\S/.test(line)) {
      line = line.replace(/^(#{1,6})(\S)/, "$1 $2")
    }

    if (/^#{1,6}\s*$/.test(line)) {
      state.consecutiveBlanks = 0
      continue
    }

    if (line.trim() === "") {
      if (state.consecutiveBlanks > 0) continue
      state.consecutiveBlanks++
      result.push(line)
      continue
    }
    state.consecutiveBlanks = 0

    const listMatch = line.match(/^(\s*)([-*+])(\s)/)
    if (listMatch) {
      const marker = listMatch[2]
      const indent = listMatch[1].length
      
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

  if (state.inFencedCode) {
    result.push(state.fenceToken)
  }

  return result.join("\n")
}