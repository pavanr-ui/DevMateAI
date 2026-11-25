/**
 * JavaScript learning path, grouped by level. Each topic name is sent to the
 * tutor as context, so keep names short and clear.
 */
export const LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

export const TOPICS = {
  beginner: [
    'Variables: let, const, var',
    'Data types',
    'Operators and == vs ===',
    'Conditionals (if, switch)',
    'Loops',
    'Functions',
    'Arrays',
    'Objects',
    'Strings and template literals',
    'DOM basics',
    'Events',
  ],
  intermediate: [
    'Scope and hoisting',
    'Closures',
    'The this keyword',
    'Arrow functions',
    'Destructuring and spread',
    'map, filter and reduce',
    'Promises',
    'async / await',
    'Fetch API and JSON',
    'ES modules',
    'Error handling',
    'Classes',
    'Prototypes and inheritance',
  ],
  advanced: [
    'Event loop and microtasks',
    'Generators and iterators',
    'Proxy and Reflect',
    'Symbols',
    'WeakMap, WeakSet and WeakRef',
    'Debounce and throttle',
    'Immutability and structuredClone',
    'Memory leaks and garbage collection',
    'Performance optimization',
    'Design patterns in JavaScript',
  ],
}

/** One-click activities for a topic. `mode` must match LEARN_MODES on the server. */
export const ACTIVITIES = [
  { mode: 'explain', label: 'Explain', message: (t) => `Explain "${t}" to me.` },
  { mode: 'examples', label: 'Examples', message: (t) => `Show me practical examples of "${t}".` },
  { mode: 'exercise', label: 'Exercise', message: (t) => `Give me a practice exercise on "${t}".` },
  { mode: 'interview', label: 'Interview', message: (t) => `Start a mock interview about "${t}".` },
]
