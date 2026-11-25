/**
 * Line-by-line diff between the original and corrected code.
 *
 * Uses the classic "longest common subsequence" algorithm: lines that appear
 * in both versions (in order) are unchanged; the rest are removed or added.
 */

/** Above this many line pairs the LCS table gets too big; we skip the diff. */
const MAX_CELLS = 4_000_000

const splitLines = (text) => text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')

/**
 * @returns {Array<{type: 'same'|'add'|'del', text: string, oldLine: number|null, newLine: number|null}> | null}
 *          null when the inputs are too large to diff
 */
export function diffLines(oldText, newText) {
  const a = splitLines(oldText)
  const b = splitLines(newText)
  const n = a.length
  const m = b.length
  if ((n + 1) * (m + 1) > MAX_CELLS) return null

  // lcs[i][j] = length of the LCS of a[i..] and b[j..], stored in one flat array
  const width = m + 1
  const lcs = new Uint32Array((n + 1) * width)
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i * width + j] =
        a[i] === b[j]
          ? lcs[(i + 1) * width + j + 1] + 1
          : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1])
    }
  }

  const out = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i], oldLine: i + 1, newLine: j + 1 })
      i++
      j++
    } else if (lcs[(i + 1) * width + j] >= lcs[i * width + j + 1]) {
      out.push({ type: 'del', text: a[i], oldLine: i + 1, newLine: null })
      i++
    } else {
      out.push({ type: 'add', text: b[j], oldLine: null, newLine: j + 1 })
      j++
    }
  }
  while (i < n) out.push({ type: 'del', text: a[i], oldLine: ++i, newLine: null })
  while (j < m) out.push({ type: 'add', text: b[j], oldLine: null, newLine: ++j })
  return out
}

/**
 * Collapses long runs of unchanged lines, keeping `context` lines around
 * each change, so reviewers see only what matters.
 * Collapsed runs become { type: 'skip', count }.
 */
export function collapseUnchanged(lines, context = 3) {
  const keep = new Array(lines.length).fill(false)
  lines.forEach((line, index) => {
    if (line.type === 'same') return
    for (
      let k = Math.max(0, index - context);
      k <= Math.min(lines.length - 1, index + context);
      k++
    )
      keep[k] = true
  })

  const out = []
  let skipped = 0
  lines.forEach((line, index) => {
    if (keep[index]) {
      if (skipped) out.push({ type: 'skip', count: skipped })
      skipped = 0
      out.push(line)
    } else {
      skipped++
    }
  })
  if (skipped) out.push({ type: 'skip', count: skipped })
  return out
}

export function diffStats(lines) {
  return {
    added: lines.filter((l) => l.type === 'add').length,
    removed: lines.filter((l) => l.type === 'del').length,
  }
}
