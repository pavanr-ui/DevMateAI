/**
 * Project form rules. They mirror firestore.rules, so users see a friendly
 * message before the server would reject the save.
 */
export const PROJECT_LIMITS = {
  name: 80,
  description: 500,
  tags: 10,
  tagLength: 30,
}

/** "Vue, Firebase,  , Tailwind" -> ['Vue', 'Firebase', 'Tailwind'] (deduplicated) */
export function parseTechStack(text) {
  const seen = new Set()
  return text
    .split(',')
    .map((t) => t.trim())
    .filter((t) => {
      const key = t.toLowerCase()
      if (!t || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

export function validateProject({ name, description, techStack }) {
  const errors = { name: '', description: '', techStack: '' }
  const trimmed = name.trim()
  if (!trimmed) errors.name = 'Project name is required.'
  else if (trimmed.length > PROJECT_LIMITS.name)
    errors.name = `Use ${PROJECT_LIMITS.name} characters or fewer.`

  if (description.trim().length > PROJECT_LIMITS.description)
    errors.description = `Use ${PROJECT_LIMITS.description} characters or fewer.`

  if (techStack.length > PROJECT_LIMITS.tags)
    errors.techStack = `Add up to ${PROJECT_LIMITS.tags} technologies.`
  else if (techStack.some((t) => t.length > PROJECT_LIMITS.tagLength))
    errors.techStack = `Each technology must be ${PROJECT_LIMITS.tagLength} characters or fewer.`

  return { errors, valid: !errors.name && !errors.description && !errors.techStack }
}
