import type { ShikiTransformer } from "shiki"

type HastNode = { properties: Record<string, unknown> }

function appendClass(node: HastNode, className: string) {
  const existing = node.properties.class
  if (Array.isArray(existing)) {
    existing.push(className)
  } else if (typeof existing === "string") {
    node.properties.class = `${existing} ${className}`
  } else {
    node.properties.class = className
  }
}

function addClassTransformer(name: string, className: string): ShikiTransformer {
  return {
    name,
    pre(node) {
      appendClass(node, className)
    },
  }
}

const showLineNumbers = (): ShikiTransformer =>
  addClassTransformer("AddLineNumbers", "shiki-line-numbers")

const wordWrapContent = (): ShikiTransformer =>
  addClassTransformer("WordWrap", "shiki-word-wrap")

const addLanguageProperty = (): ShikiTransformer => ({
  name: "AddLanguageProperty",
  pre(node) {
    const lang = this.options.lang
    if (lang) {
      node.properties["data-language"] = lang
    }
  },
})

export { showLineNumbers, wordWrapContent, addLanguageProperty }
