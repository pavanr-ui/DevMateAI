/**
 * Markdown -> safe HTML segments.
 *
 * AI output is untrusted text: it could contain <script>, onerror=, or
 * javascript: links (by accident or via prompt injection). Every HTML piece
 * goes through DOMPurify before it reaches the page.
 *
 * Code blocks are returned separately so Vue can render them with a real
 * <CodeBlock> component (syntax highlighting + copy button).
 */
import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.setOptions({ gfm: true, breaks: false })

// Open links in a new tab, safely.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer nofollow')
  }
})

const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'iframe'],
  FORBID_ATTR: ['style'],
}

export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, SANITIZE_OPTIONS)
}

/** Common aliases -> Shiki language ids */
const LANG_ALIASES = {
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  py: 'python',
  'c#': 'csharp',
  cs: 'csharp',
  'c++': 'cpp',
  kt: 'kotlin',
  yml: 'yaml',
  md: 'markdown',
  htm: 'html',
}

export function normalizeLang(lang) {
  const id = String(lang ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
  return LANG_ALIASES[id] ?? id
}

/**
 * Splits markdown into [{ type: 'html', html }, { type: 'code', lang, code }].
 * Works on partial (still streaming) text too: an unclosed ``` fence is
 * treated as a code block that is still growing.
 */
export function splitMarkdown(markdown) {
  const tokens = marked.lexer(markdown ?? '')
  const segments = []
  let buffer = []

  const flush = () => {
    if (!buffer.length) return
    buffer.links = tokens.links
    segments.push({ type: 'html', html: sanitizeHtml(marked.parser(buffer)) })
    buffer = []
  }

  for (const token of tokens) {
    if (token.type === 'code') {
      flush()
      segments.push({ type: 'code', lang: normalizeLang(token.lang), code: token.text })
    } else {
      buffer.push(token)
    }
  }
  flush()
  return segments
}
