import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { FirstChunkTimeoutError, withFirstChunkTimeout } from '../src/utils/firstChunkTimeout.js'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** Fake AI stream: waits `firstDelay`, then yields items `gap` ms apart. */
function fakeStream(items, { firstDelay = 0, gap = 5 } = {}) {
  return async function* (signal) {
    await sleep(firstDelay)
    for (const item of items) {
      if (signal.aborted) return
      yield item
      await sleep(gap)
    }
  }
}

async function collect(iterable) {
  const out = []
  for await (const item of iterable) out.push(item)
  return out
}

describe('withFirstChunkTimeout', () => {
  test('passes items through when the first chunk arrives in time', async () => {
    const items = await collect(
      withFirstChunkTimeout(fakeStream([{ text: 'a' }, { text: 'b' }, { done: true }]), {
        ms: 200,
      }),
    )
    assert.deepEqual(items, [{ text: 'a' }, { text: 'b' }, { done: true }])
  })

  test('fails fast when the first chunk is too slow (a stalled request)', async () => {
    const started = Date.now()
    await assert.rejects(
      collect(
        withFirstChunkTimeout(fakeStream([{ text: 'late' }], { firstDelay: 5000 }), { ms: 50 }),
      ),
      FirstChunkTimeoutError,
    )
    assert.ok(Date.now() - started < 1000, 'should not wait for the stalled source')
  })

  test('also times out when starting the request itself hangs', async () => {
    const hangingStart = () => new Promise(() => {}) // never resolves
    await assert.rejects(
      collect(withFirstChunkTimeout(hangingStart, { ms: 50 })),
      FirstChunkTimeoutError,
    )
  })

  test('only "progress" items stop the timer (e.g. text, not empty chunks)', async () => {
    const source = async function* () {
      yield { empty: true } // arrives fast but is not real progress
      await sleep(300)
      yield { text: 'too late' }
    }
    await assert.rejects(
      collect(withFirstChunkTimeout(source, { ms: 100, isProgress: (p) => Boolean(p.text) })),
      FirstChunkTimeoutError,
    )
  })

  test('slow streaming AFTER the first chunk is allowed (long answers)', async () => {
    const items = await collect(
      withFirstChunkTimeout(fakeStream([{ text: 'a' }, { text: 'b' }], { gap: 150 }), { ms: 100 }),
    )
    assert.equal(items.length, 2)
  })

  test('stops when the user disconnects (parent signal)', async () => {
    const parent = new AbortController()
    setTimeout(() => parent.abort(new Error('client gone')), 30)
    await assert.rejects(
      collect(
        withFirstChunkTimeout(fakeStream([{ text: 'x' }], { firstDelay: 1000 }), {
          ms: 5000,
          parentSignal: parent.signal,
        }),
      ),
      (error) => !(error instanceof FirstChunkTimeoutError),
    )
  })
})
