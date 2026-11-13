/**
 * Date helpers. Firestore Timestamps have .toDate(); we accept those,
 * Date objects, ISO strings and epoch milliseconds.
 */
export function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** "YYYY-MM-DD" in UTC. Usage documents use this as their id. */
export function utcDayKey(date) {
  return date.toISOString().slice(0, 10)
}

/** The last `days` UTC day keys, oldest first, ending with `today`. */
export function lastDayKeys(days, today = new Date()) {
  const keys = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i),
    )
    keys.push(utcDayKey(d))
  }
  return keys
}

const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "3 hours ago", "yesterday", "just now" (in the user's language). */
export function formatRelativeTime(value, now = new Date(), locale) {
  const date = toDate(value)
  if (!date) return ''
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
  if (Math.abs(seconds) < 45) return 'just now'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return rtf.format(Math.round(seconds / 60), 'minute')
}

/** "Nov 13" style label for a "YYYY-MM-DD" key. */
export function formatDayKey(key, locale, options = { month: 'short', day: 'numeric' }) {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(
    new Date(`${key}T00:00:00Z`),
  )
}
