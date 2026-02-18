import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import {
  type HighlighterCore,
  type RegexEngine,
  createHighlighterCore,
} from "shiki/core"

import darkTheme from "@shikijs/themes/one-dark-pro"

// All supported languages
import html from "@shikijs/langs/html"
import js from "@shikijs/langs/js"
import ts from "@shikijs/langs/ts"
import tsx from "@shikijs/langs/tsx"
import jsx from "@shikijs/langs/jsx"
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
import c from "@shikijs/langs/c"
import cpp from "@shikijs/langs/cpp"
import csharp from "@shikijs/langs/csharp"
import dart from "@shikijs/langs/dart"
import graphql from "@shikijs/langs/graphql"
import hcl from "@shikijs/langs/hcl"
import kotlin from "@shikijs/langs/kotlin"
import less from "@shikijs/langs/less"
import lua from "@shikijs/langs/lua"
import nginx from "@shikijs/langs/nginx"
import php from "@shikijs/langs/php"
import powershell from "@shikijs/langs/powershell"
import r from "@shikijs/langs/r"
import ruby from "@shikijs/langs/ruby"
import sass from "@shikijs/langs/sass"
import scss from "@shikijs/langs/scss"
import svelte from "@shikijs/langs/svelte"
import swift from "@shikijs/langs/swift"
import toml from "@shikijs/langs/toml"
import vue from "@shikijs/langs/vue"

import { showLineNumbers, wordWrapContent, addLanguageProperty } from "@/lib/shiki/transformers"

let jsEngine: RegexEngine | null = null
let highlighter: Promise<HighlighterCore> | null = null

const THEME = "one-dark-pro" as const

type Languages =
  | "html" | "js" | "ts" | "tsx" | "css" | "json" | "bash"
  | "markdown" | "python" | "yaml" | "go" | "dockerfile"
  | "sql" | "rust" | "java" | "xml" | "hcl" | "terraform" | "tf" | "tfvars" | "text" | "plaintext"

const LANGUAGE_ALIASES: Record<string, string> = {
  terraform: "hcl",
  tf: "hcl",
  tfvars: "hcl",
}

const getJsEngine = (): RegexEngine => {
  jsEngine ??= createJavaScriptRegexEngine()
  return jsEngine
}

const highlight = async (): Promise<HighlighterCore> => {
  highlighter ??= createHighlighterCore({
    themes: [darkTheme],
    langs: [
      html, js, ts, tsx, jsx, css, json, bash, markdown,
      python, yaml, go, dockerfile, sql, rust, java, xml,
      c, cpp, csharp, dart, graphql, hcl, kotlin, less, lua,
      nginx, php, powershell, r, ruby, sass, scss, svelte,
      swift, toml, vue,
    ],
    engine: getJsEngine(),
  })
  return highlighter
}

async function highlightCode(code: string, lang?: string): Promise<string> {
  const h = await highlight()
  const loadedLangs = h.getLoadedLanguages()
  const normalizedLang = lang ? (LANGUAGE_ALIASES[lang] ?? lang) : undefined
  const resolvedLang = normalizedLang && loadedLangs.includes(normalizedLang) ? normalizedLang : "text"

  return h.codeToHtml(code, {
    lang: resolvedLang,
    theme: THEME,
    transformers: [showLineNumbers(), wordWrapContent(), addLanguageProperty()],
  })
}

export { highlight, highlightCode, THEME }
export type { Languages }
