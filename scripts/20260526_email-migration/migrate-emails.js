#!/usr/bin/env node
'use strict'

const { execSync } = require('child_process')
const log = require('./lib/logger')
const { parseCli } = require('./lib/args')
const { loadCsv } = require('./lib/csv')
const { connect, disconnect, models, mongoose } = require('./lib/db')
const { BackupStore } = require('./lib/backup')
const { TokenBucket } = require('./lib/rate-limit')
const { confirm, closeReadline } = require('./lib/confirm')
const { preflight } = require('./phases/preflight')
const { runPhase1 } = require('./phases/phase1-users')
const { runPhase2A } = require('./phases/phase2a-permissions')
const { runPhase2B } = require('./phases/phase2b-emails')
const { runPhase2Cstatic } = require('./phases/phase2c-static-workflow')
const { runPhase2Cconditional } = require('./phases/phase2c-conditional-workflow')
const { runPhase3 } = require('./phases/phase3-verify')

function gitSha() {
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return 'unknown'
  }
}

async function maybeConfirm({ dryRun, phaseLabel, plannedRows }) {
  if (dryRun) return true
  const phrase = `MIGRATE ${plannedRows}`
  log.info(`[${phaseLabel}] LIVE run — ${plannedRows} planned writes.`)
  const ok = await confirm(phrase)
  if (!ok) {
    log.warn(`[${phaseLabel}] confirmation declined; skipping phase`)
    return false
  }
  return true
}

async function main() {
  const args = parseCli(process.argv.slice(2))
  const dbUri = process.env.DB_URI
  if (!dbUri) {
    log.error('DB_URI environment variable is required')
    process.exit(2)
  }

  log.info(
    `Starting migration: phase=${args.phase} dryRun=${args.dryRun} batchSize=${args.batchSize} rate=${args.maxWritesPerSec}/s`,
  )

  await connect(dbUri)
  const { User, Form } = models()

  const csvResult = loadCsv(args.csv)
  log.info(
    `CSV loaded: ${csvResult.map.size} migrations (raw rows: ${csvResult.totalRows}, dropped no-ops: ${csvResult.droppedNoop})`,
  )

  // Pre-flight always runs.
  await preflight({
    User,
    mapping: csvResult.map,
    allowMissing: args.allowMissing,
  })

  const backup = new BackupStore({
    backupRoot: args.backupRoot,
    reuseDir: !!args.resume,
    dir: args.resume,
    dryRun: args.dryRun,
  })
  backup.writeManifest({
    git_sha: gitSha(),
    dry_run: args.dryRun,
    cli: args,
    csv_path: args.csv,
    csv_mappings: csvResult.map.size,
  })
  log.info(`Backup dir: ${backup.dir}`)

  const bucket = new TokenBucket(args.maxWritesPerSec)
  const ctx = {
    User,
    Form,
    mongoose,
    mapping: csvResult.map,
    backup,
    bucket,
    batchSize: args.batchSize,
    dryRun: args.dryRun,
  }

  let exitCode = 0
  try {
    const wants = (p) => args.phase === 'all' || args.phase === p
    const oldEmails = [...csvResult.map.keys()]

    if (wants('1')) {
      const plan = await User.countDocuments({ email: { $in: oldEmails } })
      if (await maybeConfirm({ dryRun: args.dryRun, phaseLabel: 'Phase 1', plannedRows: plan })) {
        await runPhase1(ctx)
      }
    }
    if (wants('2a')) {
      const plan = await Form.countDocuments({ 'permissionList.email': { $in: oldEmails } })
      if (await maybeConfirm({ dryRun: args.dryRun, phaseLabel: 'Phase 2A', plannedRows: plan })) {
        await runPhase2A(ctx)
      }
    }
    if (wants('2b')) {
      const plan = await Form.countDocuments({ emails: { $in: oldEmails } })
      if (await maybeConfirm({ dryRun: args.dryRun, phaseLabel: 'Phase 2B', plannedRows: plan })) {
        await runPhase2B(ctx)
      }
    }
    if (wants('2c')) {
      const planStatic = await Form.countDocuments({
        form_workflows: {
          $elemMatch: { workflow_type: 'static', emails: { $in: oldEmails } },
        },
      })
      if (
        await maybeConfirm({
          dryRun: args.dryRun,
          phaseLabel: 'Phase 2C-i (static)',
          plannedRows: planStatic,
        })
      ) {
        await runPhase2Cstatic(ctx)
      }
      // Conditional plan count is expensive (aggregation); show "unknown" and confirm once.
      if (
        await maybeConfirm({
          dryRun: args.dryRun,
          phaseLabel: 'Phase 2C-ii (conditional)',
          plannedRows: 'unknown-pre-scan',
        })
      ) {
        await runPhase2Cconditional(ctx)
      }
    }
    if (wants('verify') || args.phase === 'all') {
      const v = await runPhase3({ User, Form, backup })
      if (v.failed > 0) {
        log.error(`[Phase 3] FAILED: ${v.failed} mismatches`)
        exitCode = 1
      }
    }
  } catch (err) {
    log.error(`Fatal: ${err && err.stack ? err.stack : err}`)
    exitCode = 1
  } finally {
    backup.close()
    closeReadline()
    await disconnect()
  }

  process.exit(exitCode)
}

main().catch((err) => {
  log.error(`Unhandled: ${err && err.stack ? err.stack : err}`)
  process.exit(1)
})
