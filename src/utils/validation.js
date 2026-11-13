/**
 * Small, dependency-free form validators. Each returns an error message,
 * or '' when the value is valid.
 */
export const PASSWORD_MIN_LENGTH = 8
export const NAME_MAX_LENGTH = 80

// Pragmatic check (something@something.tld); Firebase validates fully.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value) {
  const email = value.trim()
  if (!email) return 'Email is required.'
  if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address.'
  return ''
}

export function validatePassword(value) {
  if (!value) return 'Password is required.'
  if (value.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  return ''
}

export function validateName(value) {
  const name = value.trim()
  if (!name) return 'Name is required.'
  if (name.length > NAME_MAX_LENGTH) return `Name must be ${NAME_MAX_LENGTH} characters or fewer.`
  return ''
}
