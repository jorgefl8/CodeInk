import type { Diagnostic } from "@codemirror/lint"
import type { EditorView } from "@codemirror/view"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkPresetLintRecommended from "remark-preset-lint-recommended"
import remarkLintNoUndefinedReferences from "remark-lint-no-undefined-references"
import remarkStringify from "remark-stringify"
import { visit } from "unist-util-visit"

// Custom plugin to fix headings without space (e.g. #Heading -> # Heading)
function remarkSmartHeadings() {
  return (tree: any) => {
    visit(tree, "paragraph", (node, index, parent) => {
      if (!node.children || node.children.length === 0) return

      const firstChild = node.children[0]
      if (firstChild.type === "text" && firstChild.value) {
        // We only care if it looks like a heading at the very start
        // Use a simpler regex to catch the potential heading part
        const textValue = firstChild.value

        // Check if it really starts with hashes
        if (!textValue.startsWith("#")) return

        // Count hashes
        let hashCount = 0
        while (hashCount < textValue.length && textValue[hashCount] === "#") {
          hashCount++
        }

        if (hashCount > 6 || hashCount === 0) return

        // Check char after hash should NOT be space (already valid) or empty
        const charAfter = textValue[hashCount]
        if (!charAfter || /\s/.test(charAfter)) return

        // It is a bad heading! e.g. "#Bad"

        // Find end of line to split
        const newlineIndex = textValue.indexOf("\n")

        let headingText = ""
        let remainingText = ""

        if (newlineIndex !== -1) {
          headingText = textValue.slice(hashCount, newlineIndex) // remove hashes
          remainingText = textValue.slice(newlineIndex + 1)
        } else {
          headingText = textValue.slice(hashCount)
        }

        const headingNode = {
          type: "heading",
          depth: hashCount,
          children: [{ type: "text", value: headingText }],
          position: undefined
        }

        if (parent && typeof index === "number") {
          if (remainingText.length > 0) {
            // Update text node to only contain the rest
            firstChild.value = remainingText

            // Insert Heading BEFORE current paragraph
            parent.children.splice(index, 0, headingNode)

            // We modified the array, so we need to adjust iteration?
            // unist-util-visit usually handles this if we return the new index?
            // If we insert at 'index', the current node (paragraph) moves to 'index+1'.
            // We want to skip visiting the paragraph again? Or it's fine.
            return index + 2
          } else {
            // Replace paragraph entirely
            parent.children[index] = headingNode
            return index + 1
          }
        }
      }
    })
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkSmartHeadings) // Run before lint to fix structure, or after? 
  // If we run it, it changes the AST. 
  // If we run before lint, lint will see a valid heading (good!).
  // If we run it, 'fixMarkdown' (stringify) will print "# Heading" (good!).
  .use(remarkPresetLintRecommended)
  .use(remarkLintNoUndefinedReferences, {
    allow: [/^!/, "x", "X", " "],
  })
  .use(remarkStringify, {
    bullet: "-",
    emphasis: "_",
    strong: "*",
    listItemIndent: "one",
    rule: "-",
  })

export function markdownLint(view: EditorView): Diagnostic[] {
  const doc = view.state.doc
  const text = doc.toString()
  const diagnostics: Diagnostic[] = []

  try {
    const file = processor.processSync(text)

    for (const msg of file.messages) {
      // Calculate from/to based on position
      // VFileMessage 'place' can be a Position, Point, or undefined.
      // Usually remark-lint provides a Position or Point.
      let from = 0
      let to = 0

      if (msg.place) {
        if ("start" in msg.place && "end" in msg.place) {
          // It's a Position
          const startLine = msg.place.start.line
          const startCol = msg.place.start.column
          const endLine = msg.place.end.line
          const endCol = msg.place.end.column

          // Convert to offset
          // CodeMirror lines are 1-indexed for .line(), columns are 1-indexed in VFile but 0-indexed in CM?
          // CM columns: "0-indexed count of characters".
          // VFile columns: "1-indexed column number".
          // So subtract 1 from column.

          try {
            // msg.place.start.offset might be available if using remark-parse with position: true (default)
            // But we need to be safe.
            if (typeof msg.place.start.offset === 'number' && typeof msg.place.end.offset === 'number') {
              from = msg.place.start.offset
              to = msg.place.end.offset
            } else {
              // Fallback to line/col calculation using CM doc
              const startLineObj = doc.line(startLine)
              from = startLineObj.from + (startCol - 1)

              const endLineObj = doc.line(endLine)
              to = endLineObj.from + (endCol - 1)
            }
          } catch (e) {
            // Fallback if lines are out of bounds (shouldn't happen with sync process)
            console.error("Error calculating position for lint message", e)
            continue
          }
        } else if ("line" in msg.place) {
          // It's a Point (start only)
          const line = msg.place.line
          const col = msg.place.column
          const lineObj = doc.line(line)
          from = lineObj.from + (col - 1)
          to = from + 1 // Mark at least one char
        }
      }

      // Ensure bounds
      if (from > doc.length) from = doc.length
      if (to > doc.length) to = doc.length
      if (from > to) {
        // specific case where from > to (e.g. end of line issue?)
        // Swap or just pin to from
        to = from
      }

      diagnostics.push({
        from,
        to,
        severity: msg.fatal === true ? "error" : "warning",
        message: msg.message,
        source: "remark-lint",
      })
    }
  } catch (err) {
    console.error("Markdown linting failed", err)
  }

  return diagnostics
}

export function fixMarkdown(text: string): string {
  try {
    const file = processor.processSync(text)
    return file.toString()
  } catch (err) {
    console.error("Markdown fix failed", err)
    return text
  }
}
