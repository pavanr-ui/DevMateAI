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
