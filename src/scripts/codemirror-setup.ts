import { EditorState } from "@codemirror/state"
import { EditorView } from "@codemirror/view"
import { basicSetup } from "codemirror"
import { markdown } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { oneDark } from "@codemirror/theme-one-dark"

let editorView: EditorView | null = null

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
        codeLanguages: languages,
        addKeymap: true,
      }),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          window.dispatchEvent(
            new CustomEvent("editor-change", {
              detail: { content: update.state.doc.toString() },
            })
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
