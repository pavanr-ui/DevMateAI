/**
 * After sign-in we send users back to the page they wanted
 * (/login?redirect=/history). The redirect value comes from the URL, so an
 * attacker could craft /login?redirect=https://evil.example. This helper
 * only allows paths inside our own app ("open redirect" protection).
 */
export function safeRedirect(value, fallback = '/dashboard') {
  if (typeof value !== 'string') return fallback
  // Must start with a single "/" (not "//host" or "/\host", which browsers
  // treat as another website) and contain no backslashes or control chars.
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  if (value.includes('\\') || hasControlCharacter(value)) return fallback
  return value
}

/** Tabs, newlines and other invisible characters (codes 0-31 and 127). */
function hasControlCharacter(text) {
  for (const char of text) {
    const code = char.charCodeAt(0)
    if (code < 32 || code === 127) return true
  }
  return false
}
