/**
 * Code Reviewer, Bug Fixer and Vue Component Generator, built on the shared analysis engine.
 */
import { createAnalysisFunction } from './analysis.js'
import {
  buildBugFixPrompt,
  buildComponentInput,
  buildComponentPrompt,
  buildReviewPrompt,
} from './prompts/analysis.js'
import {
  bugFixRequestSchema,
  bugFixResultSchema,
  componentRequestSchema,
  componentResultSchema,
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

export const aiGenerateComponent = createAnalysisFunction({
  module: 'component-generator',
  inputSchema: componentRequestSchema,
  resultSchema: componentResultSchema,
  buildPrompt: (input, project) => buildComponentPrompt({ ...input, project }),
  buildUserText: buildComponentInput,
  userContent: (input) => input.description,
  makeTitle: (input, result) =>
    `${result.kind === 'composable' ? 'Composable' : 'Component'}: ${shorten(result.name, 50)}`,
  extraUserFields: (input) => ({
    kind: input.kind,
    name: input.name || null,
    styling: input.styling,
  }),
  mockResult: (input) => ({
    name: input.name || (input.kind === 'composable' ? 'useExample' : 'ExampleCard'),
    kind: input.kind,
    summary: '🧪 Mock component (no Gemini key configured). This shows the result layout.',
    files: [
      {
        filename: input.kind === 'composable' ? 'useExample.js' : 'ExampleCard.vue',
        language: input.kind === 'composable' ? 'javascript' : 'vue',
        code:
          input.kind === 'composable'
            ? [
                "import { ref } from 'vue'",
                '',
                'export function useExample() {',
                '  const count = ref(0)',
                '  return { count }',
                '}',
              ].join('\n')
            : [
                '<script setup>',
                'defineProps({ title: { type: String, required: true } })',
                "defineEmits(['select'])",
                '</script>',
                '',
                '<template>',
                '  <button type="button" @click="$emit(\'select\')">{{ title }}</button>',
                '</template>',
              ].join('\n'),
      },
    ],
    props:
      input.kind === 'composable'
        ? []
        : [
            {
              name: 'title',
              type: 'String',
              required: true,
              default: null,
              description: 'Text shown on the card.',
            },
          ],
    emits:
      input.kind === 'composable'
        ? []
        : [{ name: 'select', payload: null, description: 'Fired when the card is clicked.' }],
    slots: [],
    usage:
      input.kind === 'composable'
        ? 'const { count } = useExample()'
        : '<ExampleCard title="Hello" @select="onSelect" />',
    explanation: 'A real explanation appears here when a Gemini key is configured.',
    accessibility: ['Uses a native <button>, so it works with the keyboard.'],
  }),
})
