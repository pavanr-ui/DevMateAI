/**
 * Stall protection for streaming AI calls.
 *
 * Gemini usually starts answering in 4-7 s, but occasionally a request sits
 * in Google's queue for minutes. Instead of leaving the user staring at
 * "thinking" dots, we give up if the FIRST useful chunk doesn't arrive in
 * time. Once text starts flowing, the timer is switched off.
 */
export class FirstChunkTimeoutError extends Error {
  constructor() {
    super('No response from the AI in time')
    this.name = 'FirstChunkTimeoutError'
  }
}

/**
 * Runs `start(signal)` (which returns an async iterable, or a promise of
 * one) and yields its items.
 *
 * @param {(signal: AbortSignal) => AsyncIterable|Promise<AsyncIterable>} start
 * @param {object} opts
 * @param {number} opts.ms               how long to wait for the first progress item
 * @param {AbortSignal} [opts.parentSignal]  e.g. the user disconnecting
 * @param {(item: any) => boolean} [opts.isProgress]  which items count as "started"
 */
export async function* withFirstChunkTimeout(start, { ms, parentSignal, isProgress = () => true }) {
  const controller = new AbortController()
  let timedOut = false

  const onParentAbort = () => controller.abort(parentSignal.reason)
  if (parentSignal?.aborted) controller.abort(parentSignal.reason)
  else parentSignal?.addEventListener('abort', onParentAbort, { once: true })

  // Rejects as soon as we abort, so a stalled `await` can't hang forever
  // even if the underlying source ignores the abort signal.
  const aborted = new Promise((_, reject) => {
    const fail = () => reject(timedOut ? new FirstChunkTimeoutError() : controller.signal.reason)
    if (controller.signal.aborted) fail()
    else controller.signal.addEventListener('abort', fail, { once: true })
  })
  aborted.catch(() => {}) // avoid "unhandled rejection" when nobody is racing it

  let timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, ms)

  try {
    const iterable = await Promise.race([start(controller.signal), aborted])
    const iterator = iterable[Symbol.asyncIterator]()
    for (;;) {
      const next = await Promise.race([iterator.next(), aborted])
      if (next.done) return
      if (timer && isProgress(next.value)) {
        clearTimeout(timer)
        timer = null
      }
      yield next.value
    }
  } catch (error) {
    if (timedOut) throw new FirstChunkTimeoutError()
    throw error
  } finally {
    clearTimeout(timer)
    parentSignal?.removeEventListener('abort', onParentAbort)
  }
}
