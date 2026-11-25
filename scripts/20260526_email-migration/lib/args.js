// @ts-check
'use strict'

const { parseArgs } = require('util')

const VALID_PHASES = new Set(['backup', '1', '2a', '2b', '2c', 'verify', 'all'])
const VALID_MODES = /** @type {const} */ (['add', 'replace'])

function todayStamp() {
  // YYYY-MM-DD (UTC). Local-date would be friendlier but UTC matches the
  // per-run timestamp inside, so artifacts sort together.
  return new Date().toISOString().slice(0, 10)
}

/**
 * @typedef {'add' | 'replace'} Mode
 *
 * @typedef {Object} CliArgs
 * @property {string} csv
 * @property {string} backupRoot
 * @property {string} phase
 * @property {Mode} mode
 * @property {boolean} dryRun
 * @property {number} batchSize
 * @property {number} maxWritesPerSec
 * @property {string | null} resume
 * @property {boolean} allowMissing
 */

/**
 * @param {string[]} argv
 * @returns {CliArgs}
 */
function parseCli(argv) {
  const { values } = parseArgs({
    args: argv,
    options: {
      csv: { type: 'string' },
      'backup-root': { type: 'string' },
      phase: { type: 'string', default: 'all' },
      mode: { type: 'string', default: 'add' },
      'dry-run': { type: 'boolean', default: false },
      'no-dry-run': { type: 'boolean', default: false },
      'batch-size': { type: 'string', default: '50' },
      'max-writes-per-sec': { type: 'string', default: '20' },
      resume: { type: 'string' },
      'allow-missing': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    strict: true,
  })

  if (values.help) {
    printHelp()
    process.exit(0)
  }

  const csv = values.csv
  if (!csv) die('--csv is required')
  // --backup-root is optional; default to a date-stamped dir in CWD so a fresh
  // run always lands somewhere sensible without operator setup.
  // The script then creates a UTC-timestamped subdirectory inside it.
  const backupRoot =
    values['backup-root'] || `./email-migration-backups/${todayStamp()}`
  const phase = values.phase
  if (!phase || !VALID_PHASES.has(phase)) {
    die(`--phase must be one of: ${[...VALID_PHASES].join(', ')}`)
  }
  const modeRaw = values.mode
  if (!modeRaw || !VALID_MODES.includes(/** @type {Mode} */ (modeRaw))) {
    die(`--mode must be one of: ${VALID_MODES.join(', ')}`)
  }
  const mode = /** @type {Mode} */ (modeRaw)

  if (values['dry-run'] && values['no-dry-run']) {
    die('Cannot combine --dry-run and --no-dry-run')
  }
  const dryRun = !values['no-dry-run']

  const batchSizeRaw = values['batch-size']
  const batchSize = Number(batchSizeRaw)
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    die('--batch-size must be a positive integer')
  }
  const maxWritesPerSec = Number(values['max-writes-per-sec'])
  if (!(maxWritesPerSec > 0)) {
    die('--max-writes-per-sec must be > 0')
  }

  return {
    csv: /** @type {string} */ (csv),
    backupRoot: /** @type {string} */ (backupRoot),
    phase: /** @type {string} */ (phase),
    mode,
    dryRun,
    batchSize,
    maxWritesPerSec,
    resume: values.resume || null,
    allowMissing: !!values['allow-missing'],
  }
}

/**
 * @param {string} msg
 * @returns {never}
 */
function die(msg) {
  console.error(`ERROR: ${msg}\n`)
  printHelp()
  process.exit(2)
}

function printHelp() {
  console.error(`Usage: node migrate-emails.js [options]

Required:
  --csv <path>                Path to migration CSV (5 columns)

Optional:
  --backup-root <path>        Parent dir for the timestamped backup folder.
                              Defaults to ./email-migration-backups/<YYYY-MM-DD>/
  --phase <name>              backup | 1 | 2a | 2b | 2c | verify | all (default: all)
  --mode <add|replace>        Phase 2A/2B behavior (default: add).
                              Phase 1 and Phase 2C always replace.
                              Replace-mode collisions prompt per form.
  --no-dry-run                Actually write to the DB (default: dry-run only)
  --batch-size <n>            In-flight writes per phase (default: 50)
  --max-writes-per-sec <n>    Global token-bucket throttle (default: 20)
  --resume <dir>              Re-use an existing backup dir (re-scans, idempotent)
  --allow-missing             Allow CSV rows whose oldEmail has no matching User
  --help                      Show this message

Env:
  DB_URI                      MongoDB connection string (required)
`)
}

module.exports = { parseCli, VALID_PHASES }
