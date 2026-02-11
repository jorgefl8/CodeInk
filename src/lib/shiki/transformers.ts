import type { ShikiTransformer } from "shiki"

const showLineNumbers = (): ShikiTransformer => {
  return {
    name: "AddLineNumbers",
    pre(node) {
      const shikiStyles = node.properties.class
      if (Array.isArray(shikiStyles)) {
        shikiStyles.push("shiki-line-numbers")
      } else if (typeof shikiStyles === "string") {
        node.properties.class = `${shikiStyles} shiki-line-numbers`
      } else {
        node.properties.class = "shiki-line-numbers"
      }
    },
  }
}

const wordWrapContent = (): ShikiTransformer => {
  return {
    name: "WordWrap",
    pre(node) {
      const existingClass = node.properties.class
      if (Array.isArray(existingClass)) {
        existingClass.push("shiki-word-wrap")
      } else if (typeof existingClass === "string") {
        node.properties.class = `${existingClass} shiki-word-wrap`
      } else {
        node.properties.class = "shiki-word-wrap"
      }
    },
  }
}

const addLanguageProperty = (): ShikiTransformer => {
  return {
    name: "AddLanguageProperty",
    pre(node) {
      const lang = this.options.lang
      if (lang) {
        node.properties["data-language"] = lang
      }
    },
  }
}

export { showLineNumbers, wordWrapContent, addLanguageProperty }
