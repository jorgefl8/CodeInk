import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import {
  type HighlighterCore,
  type RegexEngine,
  createHighlighterCore,
} from "shiki/core"

import darkTheme from "@shikijs/themes/one-dark-pro"

import html from "@shikijs/langs/html"
import js from "@shikijs/langs/js"
import ts from "@shikijs/langs/ts"
import tsx from "@shikijs/langs/tsx"
import css from "@shikijs/langs/css"
import json from "@shikijs/langs/json"
import bash from "@shikijs/langs/bash"
import markdown from "@shikijs/langs/markdown"
import python from "@shikijs/langs/python"
import yaml from "@shikijs/langs/yaml"
import go from "@shikijs/langs/go"
import dockerfile from "@shikijs/langs/dockerfile"
import sql from "@shikijs/langs/sql"
import rust from "@shikijs/langs/rust"
import java from "@shikijs/langs/java"
import xml from "@shikijs/langs/xml"

import { showLineNumbers, wordWrapContent, addLanguageProperty } from "@/lib/shiki/transformers"

let jsEngine: RegexEngine | null = null
let highlighter: Promise<HighlighterCore> | null = null

const THEME = "one-dark-pro" as const

type Languages =
  | "html" | "js" | "ts" | "tsx" | "css" | "json" | "bash"
  | "markdown" | "python" | "yaml" | "go" | "dockerfile"
  | "sql" | "rust" | "java" | "xml" | "text" | "plaintext"

const getJsEngine = (): RegexEngine => {
  jsEngine ??= createJavaScriptRegexEngine()
  return jsEngine
}

const highlight = async (): Promise<HighlighterCore> => {
  highlighter ??= createHighlighterCore({
    themes: [darkTheme],
    langs: [
      html, js, ts, tsx, css, json, bash, markdown,
      python, yaml, go, dockerfile, sql, rust, java, xml,
    ],
    engine: getJsEngine(),
  })
  return highlighter
}

async function highlightCode(code: string, lang?: string): Promise<string> {
  const h = await highlight()
  const loadedLangs = h.getLoadedLanguages()
  const resolvedLang = lang && loadedLangs.includes(lang) ? lang : "text"

  return h.codeToHtml(code, {
    lang: resolvedLang,
    theme: THEME,
    transformers: [showLineNumbers(), wordWrapContent(), addLanguageProperty()],
  })
}

export { highlight, highlightCode, THEME }
export type { Languages }
