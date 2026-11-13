#!/usr/bin/env node
/**
 * Starts the Firebase emulators and KEEPS their data between restarts.
 *
 * Data is saved to ./emulator-data (git-ignored) when you stop the
 * emulators with Ctrl+C, and loaded again on the next start.
 * Delete that folder to start from a clean slate.
 */
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'

// The Functions emulator runs backend code with the `node` on your PATH.
// Firebase Admin needs Node 22+, so stop early with a clear message.
const nodeMajor = Number(process.versions.node.split('.')[0])
if (nodeMajor < 22) {
  console.error(
    `\n✖ Node ${process.versions.node} is active, but DevMate AI needs Node 22+.\n` +
      '  Run:  nvm use 22.23.3   (then start the emulators again)\n',
  )
  process.exit(1)
}

const DATA_DIR = './emulator-data'
const hasSavedData = existsSync(`${DATA_DIR}/firebase-export-metadata.json`)

const args = [
  'emulators:start',
  '--project',
  'demo-devmate-ai',
  `--export-on-exit=${DATA_DIR}`,
  ...(hasSavedData ? [`--import=${DATA_DIR}`] : []),
]

console.log(hasSavedData ? 'Loading saved emulator data…' : 'Starting with empty emulators…')

const child = spawn('firebase', args, { stdio: 'inherit', shell: true })
child.on('exit', (code) => process.exit(code ?? 0))
// Ctrl+C reaches the Firebase CLI directly (same console), which then exports the data.
process.on('SIGINT', () => {})
