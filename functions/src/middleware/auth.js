import { errors } from '../utils/errors.js'

/**
 * Every AI function requires a signed-in user. Firebase verifies the ID
 * token for us and fills request.auth; we only need to check it exists.
 */
export function requireAuth(request) {
  const uid = request.auth?.uid
  if (!uid) throw errors.unauthenticated()
  return uid
}
