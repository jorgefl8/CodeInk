import { createJavaScriptRegexEngine } from "shiki/engine/javascript"
import {
  type HighlighterCore,
  type RegexEngine,
  createHighlighterCore,
} from "shiki/core"

import darkTheme from "@shikijs/themes/one-dark-pro"
import lightTheme from "@shikijs/themes/github-light"

import { showLineNumbers, wordWrapContent, addLanguageProperty } from "@/lib/shiki/transformers"

let jsEngine: RegexEngine | null = null
let highlighter: Promise<HighlighterCore> | null = null
const loadedLanguages = new Set<string>()

const THEME = {
  dark: "one-dark-pro",
  light: "github-light",
} as const

type LanguageInput = Parameters<HighlighterCore["loadLanguage"]>[0]
type LanguageModule = { default: LanguageInput }
type LanguageLoader = () => Promise<LanguageModule>

const LANGUAGE_LOADERS = {
  html: () => import("@shikijs/langs/html"),
  js: () => import("@shikijs/langs/js"),
  ts: () => import("@shikijs/langs/ts"),
  tsx: () => import("@shikijs/langs/tsx"),
  jsx: () => import("@shikijs/langs/jsx"),
  css: () => import("@shikijs/langs/css"),
  json: () => import("@shikijs/langs/json"),
  bash: () => import("@shikijs/langs/bash"),
  markdown: () => import("@shikijs/langs/markdown"),
  python: () => import("@shikijs/langs/python"),
  yaml: () => import("@shikijs/langs/yaml"),
  go: () => import("@shikijs/langs/go"),
  hcl: () => import("@shikijs/langs/hcl"),
  dockerfile: () => import("@shikijs/langs/dockerfile"),
  sql: () => import("@shikijs/langs/sql"),
  rust: () => import("@shikijs/langs/rust"),
  java: () => import("@shikijs/langs/java"),
  xml: () => import("@shikijs/langs/xml"),
  c: () => import("@shikijs/langs/c"),
  cpp: () => import("@shikijs/langs/cpp"),
  csharp: () => import("@shikijs/langs/csharp"),
  dart: () => import("@shikijs/langs/dart"),
  graphql: () => import("@shikijs/langs/graphql"),
  kotlin: () => import("@shikijs/langs/kotlin"),
  less: () => import("@shikijs/langs/less"),
  lua: () => import("@shikijs/langs/lua"),
  nginx: () => import("@shikijs/langs/nginx"),
  php: () => import("@shikijs/langs/php"),
  powershell: () => import("@shikijs/langs/powershell"),
  r: () => import("@shikijs/langs/r"),
  ruby: () => import("@shikijs/langs/ruby"),
  sass: () => import("@shikijs/langs/sass"),
  scss: () => import("@shikijs/langs/scss"),
  svelte: () => import("@shikijs/langs/svelte"),
  swift: () => import("@shikijs/langs/swift"),
  terraform: () => import("@shikijs/langs/terraform"),
  latex: () => import("@shikijs/langs/latex"),
  mermaid: () => import("@shikijs/langs/mermaid"),
  toml: () => import("@shikijs/langs/toml"),
  vue: () => import("@shikijs/langs/vue"),
} as const satisfies Record<string, LanguageLoader>

type CanonicalLanguage = keyof typeof LANGUAGE_LOADERS

const LANGUAGE_ALIASES: Record<string, string> = {
  plaintext: "text",
  text: "text",
  javascript: "js",
  typescript: "ts",
  docker: "dockerfile",
  md: "markdown",
  yml: "yaml",
  sh: "bash",
  shell: "bash",
  ps1: "powershell",
  tf: "terraform",
  tfvars: "terraform",
  tex: "latex",
  mmd: "mermaid",
}

function resolveTheme(theme: string | null | undefined): "light" | "dark" {
  return theme === "light" ? "light" : "dark"
}

function getDocumentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark"
  return resolveTheme(document.documentElement.getAttribute("data-theme"))
}

function normalizeLanguage(lang?: string): string {
  const normalized = (lang ?? "").toLowerCase()
  if (!normalized) return "text"
  return LANGUAGE_ALIASES[normalized] ?? normalized
}

function hasLanguageLoader(lang: string): lang is CanonicalLanguage {
  return lang in LANGUAGE_LOADERS
}

const getJsEngine = (): RegexEngine => {
  jsEngine ??= createJavaScriptRegexEngine()
  return jsEngine
}

const highlight = async (): Promise<HighlighterCore> => {
  highlighter ??= createHighlighterCore({
    themes: [darkTheme, lightTheme],
    langs: [],
    engine: getJsEngine(),
  })
  return highlighter
}

async function ensureLanguageLoaded(h: HighlighterCore, lang: CanonicalLanguage) {
  if (loadedLanguages.has(lang)) return
  const language = await LANGUAGE_LOADERS[lang]()
  h.loadLanguage(language.default)
  loadedLanguages.add(lang)
}

async function highlightCode(code: string, lang?: string): Promise<string> {
  const h = await highlight()
  const normalizedLang = normalizeLanguage(lang)

  if (normalizedLang !== "text" && hasLanguageLoader(normalizedLang)) {
    await ensureLanguageLoaded(h, normalizedLang)
  }

  const resolvedLang =
    normalizedLang !== "text" && h.getLoadedLanguages().includes(normalizedLang)
      ? normalizedLang
      : "text"

  return h.codeToHtml(code, {
    lang: resolvedLang,
    theme: THEME[getDocumentTheme()],
    transformers: [showLineNumbers(), wordWrapContent(), addLanguageProperty()],
  })
}

type Languages = CanonicalLanguage | "text" | "plaintext" | keyof typeof LANGUAGE_ALIASES

export { highlight, highlightCode, THEME }
export type { Languages }
