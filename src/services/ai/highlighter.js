/**
 * Syntax highlighting with Shiki (the engine VS Code uses).
 *
 * Loaded lazily: the highlighter and each language grammar are downloaded
 * only the first time a code block in that language appears, so pages
 * without code stay fast. Uses the JavaScript regex engine (no WebAssembly).
 *
 * Both light and dark colors are emitted as CSS variables; styles/markdown.css
 * picks the right one for the current theme without re-highlighting.
 */
const LANGUAGE_LOADERS = {
  javascript: () => import('@shikijs/langs/javascript'),
  typescript: () => import('@shikijs/langs/typescript'),
  jsx: () => import('@shikijs/langs/jsx'),
  tsx: () => import('@shikijs/langs/tsx'),
  vue: () => import('@shikijs/langs/vue'),
  html: () => import('@shikijs/langs/html'),
  css: () => import('@shikijs/langs/css'),
  scss: () => import('@shikijs/langs/scss'),
  json: () => import('@shikijs/langs/json'),
  bash: () => import('@shikijs/langs/bash'),
  python: () => import('@shikijs/langs/python'),
  java: () => import('@shikijs/langs/java'),
  kotlin: () => import('@shikijs/langs/kotlin'),
  swift: () => import('@shikijs/langs/swift'),
  csharp: () => import('@shikijs/langs/csharp'),
  cpp: () => import('@shikijs/langs/cpp'),
  go: () => import('@shikijs/langs/go'),
  rust: () => import('@shikijs/langs/rust'),
  php: () => import('@shikijs/langs/php'),
  sql: () => import('@shikijs/langs/sql'),
  yaml: () => import('@shikijs/langs/yaml'),
  markdown: () => import('@shikijs/langs/markdown'),
  diff: () => import('@shikijs/langs/diff'),
}

export const supportedLanguages = Object.keys(LANGUAGE_LOADERS)

let highlighterPromise = null
const loadedLanguages = new Set()

function getHighlighter() {
  highlighterPromise ??= (async () => {
    const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, light, dark] =
      await Promise.all([
        import('shiki/core'),
        import('shiki/engine/javascript'),
        import('@shikijs/themes/github-light'),
        import('@shikijs/themes/github-dark'),
      ])
    return createHighlighterCore({
      themes: [light.default, dark.default],
      langs: [],
      engine: createJavaScriptRegexEngine(),
    })
  })()
  return highlighterPromise
}

/**
 * Returns highlighted HTML, or null for unknown languages (the caller then
 * shows plain, escaped code). Shiki escapes the code itself.
 */
export async function highlight(code, lang) {
  if (!LANGUAGE_LOADERS[lang]) return null
  const highlighter = await getHighlighter()
  if (!loadedLanguages.has(lang)) {
    const grammar = await LANGUAGE_LOADERS[lang]()
    await highlighter.loadLanguage(grammar.default)
    loadedLanguages.add(lang)
  }
  return highlighter.codeToHtml(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  })
}
