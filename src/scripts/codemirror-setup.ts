import { Compartment, EditorState, type Extension } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { basicSetup } from "codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { oneDark } from "@codemirror/theme-one-dark"
import { linter, diagnosticCount } from "@codemirror/lint"
import { markdownLint } from "@/scripts/markdown-linter"

let editorView: EditorView | null = null
const themeCompartment = new Compartment()

function resolveTheme(theme: string | null | undefined): "light" | "dark" {
  return theme === "light" ? "light" : "dark"
}

function getDocumentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark"
  return resolveTheme(document.documentElement.getAttribute("data-theme"))
}

const lightTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--background)",
      color: "var(--foreground)",
    },
    ".cm-content": {
      caretColor: "var(--primary)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--surface)",
      color: "var(--muted-foreground)",
      borderRight: "1px solid var(--border)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
    },
    ".cm-activeLine": {
      backgroundColor: "color-mix(in srgb, var(--primary) 6%, transparent)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
    },
  },
  { dark: false },
)

function getEditorThemeExtension(theme: "light" | "dark"): Extension {
  return theme === "light" ? lightTheme : oneDark
}

export function destroyEditor() {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
}

export function createEditor(parent: HTMLElement, initialDoc: string) {
  destroyEditor()

  const state = EditorState.create({
    doc: initialDoc,
    extensions: [
      basicSetup,
      markdown({
        addKeymap: true,
      }),
      themeCompartment.of(getEditorThemeExtension(getDocumentTheme())),
      linter(markdownLint, { delay: 500 }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          window.dispatchEvent(
            new CustomEvent("editor-change", {
              detail: { content: update.state.doc.toString() },
            })
          )
        }
        const prevCount = diagnosticCount(update.startState)
        const currCount = diagnosticCount(update.state)
        if (prevCount !== currCount) {
          window.dispatchEvent(
            new CustomEvent("lint-update", { detail: { count: currCount } })
          )
        }
      }),
    ],
  })

  editorView = new EditorView({
    state,
    parent,
  })

  return editorView
}

export function setEditorTheme(theme: "light" | "dark") {
  if (!editorView) return
  editorView.dispatch({
    effects: themeCompartment.reconfigure(getEditorThemeExtension(theme)),
  })
}

export function getEditorContent(): string {
  return editorView?.state.doc.toString() ?? ""
}

export function setEditorContent(content: string) {
  if (!editorView) return
  editorView.dispatch({
    changes: {
      from: 0,
      to: editorView.state.doc.length,
      insert: content,
    },
  })
}
