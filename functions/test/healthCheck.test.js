import { test } from 'node:test'
import assert from 'node:assert/strict'
import { healthCheck } from '../src/index.js'

test('healthCheck returns ok status', async () => {
  // .run() calls the function's handler directly, without a server
  const result = await healthCheck.run({ data: {}, auth: undefined })
  assert.equal(result.status, 'ok')
  assert.equal(result.service, 'devmate-ai-functions')
  assert.ok(!Number.isNaN(Date.parse(result.time)))
})
