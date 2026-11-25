/**
 * Code languages offered in the AI tools. Values must match
 * CODE_LANGUAGES in functions/src/config.js (the server rejects others).
 */
export const CODE_LANGUAGES = [
  ['auto', 'Auto-detect'],
  ['javascript', 'JavaScript'],
  ['typescript', 'TypeScript'],
  ['vue', 'Vue 3'],
  ['html', 'HTML'],
  ['css', 'CSS'],
  ['json', 'JSON'],
  ['python', 'Python'],
  ['java', 'Java'],
  ['kotlin', 'Kotlin'],
  ['swift', 'Swift'],
  ['csharp', 'C#'],
  ['cpp', 'C++'],
  ['go', 'Go'],
  ['rust', 'Rust'],
  ['php', 'PHP'],
  ['sql', 'SQL'],
  ['bash', 'Bash'],
]

export const RESPONSE_LANGUAGES = [
  ['en', 'English'],
  ['te', 'తెలుగు (Telugu)'],
]

/** Must match functions/src/config.js maxCodeChars */
export const MAX_CODE_CHARS = 20000
