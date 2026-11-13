/**
 * Turns Firebase Auth error codes into friendly messages.
 *
 * Security note: sign-in failures deliberately say "email or password is
 * incorrect" without revealing WHICH one was wrong, so attackers can't use
 * the form to discover which emails have accounts.
 */
const MESSAGES = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/missing-password': 'Please enter your password.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
  'auth/weak-password': 'Please choose a stronger password (at least 8 characters).',
  'auth/password-does-not-meet-requirements':
    'Password does not meet the requirements. Use at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/popup-blocked': 'Your browser blocked the sign-in popup. Please allow popups and retry.',
  'auth/account-exists-with-different-credential':
    'This email is already registered with a different sign-in method.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled yet.',
}

/** Errors that mean "the user cancelled"; show nothing. */
const SILENT = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])

export function isSilentAuthError(error) {
  return SILENT.has(error?.code)
}

export function getAuthErrorMessage(error) {
  return MESSAGES[error?.code] ?? 'Something went wrong. Please try again.'
}
