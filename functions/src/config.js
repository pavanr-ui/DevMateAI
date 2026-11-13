/**
 * Central backend configuration. Change AI behaviour here, not in handlers.
 */
export const AI_CONFIG = {
  /** Default model. Model ids change over time; keep them in this one place. */
  defaultModel: 'gemini-3.6-flash',
  /** Only these models may ever be called (users can't request arbitrary ones). */
  allowedModels: ['gemini-3.6-flash', 'gemini-3.5-flash-lite'],

  /** Requests per user per UTC day, across all AI tools. */
  dailyRequestLimit: 50,

  /** Max characters in one user message (~3k tokens). */
  maxMessageChars: 12000,
  /** How many previous messages are sent to Gemini as context. */
  historyMessages: 20,
  maxOutputTokens: 8192,
  temperature: 0.4,
  /**
   * Give up if the AI hasn't started answering within this time (Gemini
   * normally starts in 4-7 s; rare queue stalls can last minutes).
   */
  firstTokenTimeoutMs: 45_000,
  /** Hard limit for a whole request, including long answers. */
  timeoutSeconds: 180,
}

export const CODE_LANGUAGES = [
  'auto',
  'javascript',
  'typescript',
  'vue',
  'html',
  'css',
  'json',
  'python',
  'java',
  'kotlin',
  'swift',
  'csharp',
  'cpp',
  'go',
  'rust',
  'php',
  'sql',
  'bash',
]

export const ASSISTANT_MODES = ['chat', 'generate', 'explain', 'optimize']
export const RESPONSE_LANGUAGES = ['en', 'te']
