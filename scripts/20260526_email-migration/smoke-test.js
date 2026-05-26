#!/usr/bin/env node
// @ts-check
'use strict'

/**
 * End-to-end smoke test for the email migration script.
 *
 * Pass 1: --mode add (default).
 *   - Phase 1 always replaces user emails.
 *   - Phase 2A adds new permissionList entries alongside old (copying write rights).
 *   - Phase 2B appends new notification emails alongside old.
 *
 * Pass 2: --mode replace.
 *   - Phase 1 finds no work (users already migrated).
 *   - Phase 2A collapses old+new entries via collision prompt (operator says 'all').
 *   - Phase 2B collapses old+new emails via collision prompt (operator says 'all').
 *
 * Phase 2C is currently disabled in migrate-emails.js orchestration; F3/F4
 * seed data is preserved for when 2C is re-enabled.
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

/**
 * @param {unknown} cond
 * @param {string} msg
 * @returns {asserts cond}
 */
function assert(cond, msg) {
  if (!cond) {
    console.error(`ASSERTION FAILED: ${msg}`)
    process.exit(1)
  }
}

/**
 * @template T
 * @param {T | null} doc
 * @param {string} label
 * @returns {T}
 */
function requireDoc(doc, label) {
  assert(doc, `${label} not found`)
  return doc
}

/**
 * @param {string[]} args
 * @param {string} input
 * @param {string} uri
 */
function runMigrate(args, input, uri) {
  const result = spawnSync('node', ['migrate-emails.js', ...args], {
    cwd: __dirname,
    env: { ...process.env, DB_URI: uri, MIGRATE_ALLOW_PIPED_CONFIRM: '1' },
    stdio: ['pipe', 'inherit', 'inherit'],
    input,
  })
  if (result.status !== 0) {
    console.error(`migrate-emails.js exited with status ${result.status}`)
    process.exit(result.status || 1)
  }
}

async function main() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'email-mig-smoke-'))
  const csvPath = path.join(tmpRoot, 'emails.csv')
  const backupRoot = path.join(tmpRoot, 'backups')
  console.log(`tmp dir: ${tmpRoot}`)

  fs.writeFileSync(
    csvPath,
    [
      'username,display_name,old_email,new_display_name,new_email',
      'u1,Alice,alice.old@x.gov.sg,Alice,alice.new@x.gov.sg',
      'u2,Bob,bob.old@x.gov.sg,Bob,bob.new@x.gov.sg',
      'u3,Carol,carol.old@x.gov.sg,Carol,carol.new@x.gov.sg',
    ].join('\n'),
  )

  const mongod = await MongoMemoryServer.create()
  const uri = mongod.getUri()
  console.log(`mongo uri: ${uri}`)

  await mongoose.connect(uri)
  const db = mongoose.connection.db
  assert(db, 'db handle')

  const users = [
    { email: 'alice.old@x.gov.sg', name: 'Alice' },
    { email: 'bob.old@x.gov.sg', name: 'Bob' },
    { email: 'carol.old@x.gov.sg', name: 'Carol' },
    { email: 'dave@x.gov.sg', name: 'Dave' }, // untouched control
  ]
  const userInsert = await db.collection('users').insertMany(users)

  // F1: permissionList — alice (only old), bob (both old and new — collision in replace).
  // F2: notification emails — carol only old, plus unrelated. add-mode appends carol.new.
  // F3/F4: 2C data, untouched in this run (2C disabled in CLI orchestration).
  // F5: control, no oldEmails anywhere.
  await db.collection('forms').insertMany([
    {
      title: 'F1',
      responseMode: 'encrypt',
      permissionList: [
        { email: 'alice.old@x.gov.sg', write: false },
        { email: 'bob.old@x.gov.sg', write: false },
        { email: 'bob.new@x.gov.sg', write: true },
        { email: 'unrelated@x.gov.sg', write: false },
      ],
      lastModified: new Date('2026-01-01'),
    },
    {
      title: 'F2',
      responseMode: 'email',
      emails: ['carol.old@x.gov.sg', 'other@x.gov.sg'],
      lastModified: new Date('2026-01-02'),
    },
    {
      title: 'F3',
      responseMode: 'multirespondent',
      form_workflows: [
        {
          _id: new mongoose.Types.ObjectId(),
          workflow_type: 'static',
          emails: ['alice.old@x.gov.sg', 'noop@x.gov.sg'],
        },
      ],
      lastModified: new Date('2026-01-03'),
    },
    {
      title: 'F4',
      responseMode: 'multirespondent',
      form_fields: [
        {
          _id: new mongoose.Types.ObjectId(),
          fieldType: 'dropdown',
          optionsToRecipientsMap: {
            yes: ['bob.old@x.gov.sg', 'extra@x.gov.sg'],
            no: ['unrelated@x.gov.sg'],
          },
        },
      ],
      lastModified: new Date('2026-01-04'),
    },
    {
      title: 'F5-untouched',
      responseMode: 'encrypt',
      permissionList: [{ email: 'unrelated@x.gov.sg', write: true }],
      lastModified: new Date('2026-01-05'),
    },
  ])

  await mongoose.disconnect()

  // ---------- PASS 1: add-mode (default) ----------
  console.log('\n=== PASS 1: add-mode ===')
  // 2C is commented out in migrate-emails.js — no prompts for 2C-i / 2C-ii.
  // Phase 1: 3 users to migrate.
  // Phase 2A: 1 form (F1 contains old emails).
  // Phase 2B: 1 form (F2).
  runMigrate(
    [
      '--csv', csvPath,
      '--backup-root', backupRoot,
      '--phase', 'all',
      '--no-dry-run',
      '--batch-size', '5',
      '--max-writes-per-sec', '100',
    ],
    ['MIGRATE 3', 'MIGRATE 1', 'MIGRATE 1', ''].join('\n'),
    uri,
  )

  console.log('--- verifying PASS 1 post-state ---')
  await mongoose.connect(uri)
  const db2 = mongoose.connection.db
  assert(db2, 'db handle 2')

  // Users replaced.
  const uAlice = requireDoc(
    await db2.collection('users').findOne({ _id: userInsert.insertedIds[0] }),
    'Alice',
  )
  assert(uAlice.email === 'alice.new@x.gov.sg', `Alice email: ${uAlice.email}`)
  const uDave = requireDoc(
    await db2.collection('users').findOne({ _id: userInsert.insertedIds[3] }),
    'Dave',
  )
  assert(uDave.email === 'dave@x.gov.sg', `Dave untouched: ${uDave.email}`)

  // F1: alice.new added (write=false copied from alice.old); bob.new already present, no change.
  const f1Add = requireDoc(await db2.collection('forms').findOne({ title: 'F1' }), 'F1 add')
  /** @type {Array<{ email: string, write: boolean }>} */
  const f1AddList = f1Add.permissionList
  const f1AddEmails = f1AddList.map((p) => p.email).sort()
  assert(
    JSON.stringify(f1AddEmails) ===
      JSON.stringify([
        'alice.new@x.gov.sg',
        'alice.old@x.gov.sg',
        'bob.new@x.gov.sg',
        'bob.old@x.gov.sg',
        'unrelated@x.gov.sg',
      ]),
    `F1 add permissionList: ${JSON.stringify(f1AddEmails)}`,
  )
  const aliceNewAdd = f1AddList.find((p) => p.email === 'alice.new@x.gov.sg')
  assert(
    aliceNewAdd && aliceNewAdd.write === false,
    `alice.new added with write=false: ${aliceNewAdd?.write}`,
  )

  // F2: carol.new appended; carol.old stays.
  const f2Add = requireDoc(await db2.collection('forms').findOne({ title: 'F2' }), 'F2 add')
  assert(
    JSON.stringify(f2Add.emails) ===
      JSON.stringify(['carol.old@x.gov.sg', 'other@x.gov.sg', 'carol.new@x.gov.sg']),
    `F2 add emails: ${JSON.stringify(f2Add.emails)}`,
  )

  // F5 untouched.
  const f5Add = requireDoc(
    await db2.collection('forms').findOne({ title: 'F5-untouched' }),
    'F5 add',
  )
  assert(
    f5Add.permissionList[0].email === 'unrelated@x.gov.sg',
    `F5 untouched: ${f5Add.permissionList[0].email}`,
  )

  await mongoose.disconnect()

  // ---------- PASS 2: replace-mode ----------
  console.log('\n=== PASS 2: replace-mode ===')
  // Phase 1: 0 users (already migrated).
  // Phase 2A: 1 form (F1, old emails still present). Two collisions
  //   (alice.old vs alice.new, bob.old vs bob.new). 'a' on first auto-merges
  //   the second.
  // Phase 2B: 1 form (F2). One collision (carol.old vs carol.new). 'y' merge.
  runMigrate(
    [
      '--csv', csvPath,
      '--backup-root', backupRoot,
      '--phase', 'all',
      '--mode', 'replace',
      '--no-dry-run',
      '--allow-missing',
      '--batch-size', '5',
      '--max-writes-per-sec', '100',
    ],
    [
      'MIGRATE 0', // Phase 1 has 0 planned
      'MIGRATE 1', // Phase 2A
      'a',         // collision 1 — merge all subsequent
      'MIGRATE 1', // Phase 2B
      'y',         // collision (autoMergeAll only applies within a phase via the prompt state — be safe)
      '',
    ].join('\n'),
    uri,
  )

  console.log('--- verifying PASS 2 post-state ---')
  await mongoose.connect(uri)
  const db3 = mongoose.connection.db
  assert(db3, 'db handle 3')

  // F1: collapsed. bob merged write=true. alice.new has write=false (alice.old was false, alice.new from pass 1 was false).
  const f1Rep = requireDoc(await db3.collection('forms').findOne({ title: 'F1' }), 'F1 replace')
  /** @type {Array<{ email: string, write: boolean }>} */
  const f1RepList = f1Rep.permissionList
  const f1RepEmails = f1RepList.map((p) => p.email).sort()
  assert(
    JSON.stringify(f1RepEmails) ===
      JSON.stringify(['alice.new@x.gov.sg', 'bob.new@x.gov.sg', 'unrelated@x.gov.sg']),
    `F1 replace permissionList: ${JSON.stringify(f1RepEmails)}`,
  )
  const bobNewRep = f1RepList.find((p) => p.email === 'bob.new@x.gov.sg')
  assert(
    bobNewRep && bobNewRep.write === true,
    `F1 bob merged write=true: ${bobNewRep?.write}`,
  )

  // F2: collapsed to [carol.new, other] (carol.old replaced; existing carol.new deduped).
  const f2Rep = requireDoc(await db3.collection('forms').findOne({ title: 'F2' }), 'F2 replace')
  assert(
    JSON.stringify(f2Rep.emails) ===
      JSON.stringify(['carol.new@x.gov.sg', 'other@x.gov.sg']),
    `F2 replace emails: ${JSON.stringify(f2Rep.emails)}`,
  )

  // Two timestamped backup dirs now exist (one per pass).
  const dirs = fs.readdirSync(backupRoot).sort()
  assert(dirs.length === 2, `expected 2 backup dirs, got ${dirs.length}`)

  await mongoose.disconnect()
  await mongod.stop()

  console.log('\nSMOKE TEST PASSED (add + replace)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
