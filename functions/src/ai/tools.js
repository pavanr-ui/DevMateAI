/**
 * The Code Reviewer and Bug Fixer, built on the shared analysis engine.
 */
import { createAnalysisFunction } from './analysis.js'
import { buildBugFixPrompt, buildReviewPrompt } from './prompts/analysis.js'
import {
  bugFixRequestSchema,
  bugFixResultSchema,
  reviewRequestSchema,
  reviewResultSchema,
} from '../schemas/analysis.js'

const shorten = (text, max = 60) => {
  const t = String(text ?? '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > max ? `${t.slice(0, max - 1)}…` : t
}

/** A readable name for a code snippet: its first declaration, or first line. */
export function codeTitle(code) {
  const lines = code
    .split('\n')
    .map((l) => l.trim())
    // Skip comments, imports and Vue/HTML wrapper tags like <script setup>.
    .filter((l) => l && !/^(\/\/|\/\*|\*|#|<!--|import\b|<\/?(script|template|style)\b)/.test(l))
  const declaration = lines.find((l) =>
    /^(export\s+)?(default\s+)?(async\s+)?(function|class|const|let|def|public|private|fun|func|interface)\b/.test(
      l,
    ),
  )
  return shorten(declaration ?? lines[0] ?? 'Code snippet')
}

export const aiReview = createAnalysisFunction({
  module: 'reviewer',
  inputSchema: reviewRequestSchema,
  resultSchema: reviewResultSchema,
  buildPrompt: (input, project) => buildReviewPrompt({ ...input, project }),
  makeTitle: (input) => `Review: ${codeTitle(input.code)}`,
  extraUserFields: (input) => ({ focus: input.focus }),
  mockResult: (input) => ({
    language: input.language === 'auto' ? 'javascript' : input.language,
    summary: '🧪 Mock review (no Gemini key configured). This shows what a real review looks like.',
    score: 62,
    issues: [
      {
        severity: 'high',
        category: 'security',
        title: 'Example: untrusted HTML inserted into the page',
        line: 1,
        description: 'Setting innerHTML with user data allows cross-site scripting (XSS).',
        suggestion: 'Use textContent, or sanitize the HTML first.',
      },
      {
        severity: 'medium',
        category: 'bug',
        title: 'Example: missing error handling',
        line: null,
        description: 'Failures are not caught, so the user sees nothing when something breaks.',
        suggestion: 'Wrap the call in try/catch and show a friendly message.',
      },
      {
        severity: 'low',
        category: 'style',
        title: 'Example: unclear variable name',
        line: 2,
        description: 'Short names like "d" make code harder to read.',
        suggestion: 'Use descriptive names such as "userData".',
      },
    ],
    strengths: ['Small, focused function', 'Easy to follow control flow'],
    correctedCode: `// Mock corrected code\n${input.code}`,
  }),
})

export const aiFixBug = createAnalysisFunction({
  module: 'bug-fixer',
  inputSchema: bugFixRequestSchema,
  resultSchema: bugFixResultSchema,
  buildPrompt: (input, project) => buildBugFixPrompt({ ...input, project }),
  makeTitle: (input, result) => `Fix: ${shorten(result.summary || codeTitle(input.code), 55)}`,
  extraUserFields: (input) => ({ error: input.error, expected: input.expected }),
  mockResult: (input) => ({
    language: input.language === 'auto' ? 'javascript' : input.language,
    summary: '🧪 Mock fix: a value is used before it is ready.',
    rootCause: 'Example root cause: an async function result is used without await.',
    explanation:
      'This is a mock response. With a Gemini key, you get a real explanation of why the bug happens.',
    fixSteps: ['Mark the function async', 'Await the promise before using its value'],
    changes: [{ line: 1, description: 'Example change on line 1' }],
    prevention: ['Enable the no-floating-promises lint rule'],
    fixedCode: `// Mock fixed code\n${input.code}`,
  }),
})
