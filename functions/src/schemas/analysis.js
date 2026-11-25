/**
 * Schemas for the Code Reviewer and Bug Fixer.
 *
 * Input schemas validate what the browser sends.
 * Result schemas are used twice: converted to JSON Schema so Gemini must
 * answer in exactly this shape, and again to validate Gemini's answer
 * before we save it or show it.
 */
import { z } from 'zod'
import { AI_CONFIG, CODE_LANGUAGES, RESPONSE_LANGUAGES } from '../config.js'

const firestoreId = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, 'Invalid id')

const code = z
  .string()
  .max(
    AI_CONFIG.maxCodeChars,
    `Code can be up to ${AI_CONFIG.maxCodeChars.toLocaleString('en')} characters.`,
  )
  .refine((v) => v.trim().length > 0, 'Please paste some code.')

const common = {
  code,
  language: z.enum(CODE_LANGUAGES).default('auto'),
  responseLanguage: z.enum(RESPONSE_LANGUAGES).default('en'),
  projectId: firestoreId.nullish(),
}

export const REVIEW_FOCUS = ['bugs', 'security', 'performance', 'quality']

export const reviewRequestSchema = z.object({
  ...common,
  focus: z.array(z.enum(REVIEW_FOCUS)).max(REVIEW_FOCUS.length).default(REVIEW_FOCUS),
})

export const bugFixRequestSchema = z.object({
  ...common,
  error: z.string().max(4000, 'The error message can be up to 4,000 characters.').default(''),
  expected: z.string().max(1000, 'Keep "expected behaviour" under 1,000 characters.').default(''),
})

// ---------------------------------------------------------------------------
// Results (what Gemini must return)
// ---------------------------------------------------------------------------
const lineNumber = z.number().int().min(1).nullable()

export const reviewResultSchema = z.object({
  language: z.string().max(40),
  summary: z.string().max(1200),
  score: z.number().int().min(0).max(100),
  issues: z
    .array(
      z.object({
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        category: z.enum(['bug', 'security', 'performance', 'quality', 'style']),
        title: z.string().max(160),
        line: lineNumber,
        description: z.string().max(1500),
        suggestion: z.string().max(1500),
      }),
    )
    .max(25),
  strengths: z.array(z.string().max(300)).max(6),
  correctedCode: z.string().max(AI_CONFIG.maxCodeChars * 2),
})

export const bugFixResultSchema = z.object({
  language: z.string().max(40),
  summary: z.string().max(600),
  rootCause: z.string().max(1500),
  explanation: z.string().max(3000),
  fixSteps: z.array(z.string().max(500)).max(10),
  changes: z.array(z.object({ line: lineNumber, description: z.string().max(500) })).max(20),
  prevention: z.array(z.string().max(400)).max(6),
  fixedCode: z.string().max(AI_CONFIG.maxCodeChars * 2),
})

// ---------------------------------------------------------------------------
// Vue Component Generator
// ---------------------------------------------------------------------------
export const COMPONENT_KINDS = ['component', 'composable']
export const COMPONENT_STYLING = ['tailwind', 'scoped-css', 'none']

export const componentRequestSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, 'Describe the component in at least a few words.')
    .max(2000, 'Keep the description under 2,000 characters.'),
  kind: z.enum(COMPONENT_KINDS).default('component'),
  name: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z][A-Za-z0-9]{0,59}$/,
      'Use letters and numbers only, e.g. UserCard or useFetch.',
    )
    .nullish()
    .or(z.literal('')),
  styling: z.enum(COMPONENT_STYLING).default('tailwind'),
  responseLanguage: z.enum(RESPONSE_LANGUAGES).default('en'),
  projectId: firestoreId.nullish(),
})

export const componentResultSchema = z.object({
  name: z.string().max(60),
  kind: z.enum(COMPONENT_KINDS),
  summary: z.string().max(600),
  files: z
    .array(
      z.object({
        filename: z.string().max(80),
        language: z.enum(['vue', 'javascript', 'css']),
        code: z.string().max(AI_CONFIG.maxCodeChars),
      }),
    )
    .min(1)
    .max(4),
  props: z
    .array(
      z.object({
        name: z.string().max(60),
        type: z.string().max(80),
        required: z.boolean(),
        default: z.string().max(200).nullable(),
        description: z.string().max(300),
      }),
    )
    .max(20),
  emits: z
    .array(
      z.object({
        name: z.string().max(60),
        payload: z.string().max(200).nullable(),
        description: z.string().max(300),
      }),
    )
    .max(15),
  slots: z.array(z.object({ name: z.string().max(60), description: z.string().max(300) })).max(10),
  usage: z.string().max(4000),
  explanation: z.string().max(3000),
  accessibility: z.array(z.string().max(300)).max(6),
})
