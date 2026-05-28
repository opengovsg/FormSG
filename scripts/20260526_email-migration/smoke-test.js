#!/usr/bin/env node
// @ts-check
'use strict'

/**
 * End-to-end smoke test for the email migration script.
 *
 * Covers:
 *  - Pass 1 (add-mode, default): rename alice/carol; HARD COLLISION on bob
 *    (both old and new users exist) triggers Form-ownership reassignment
 *    instead of E11000. Pre-flight PROCEED prompt acknowledges the collision.
 *  - Pass 2 (replace-mode, --allow-missing): collapse 2A and 2B old/new
 *    entries silently; the second hard-collision reassignment is a no-op.
 *
 * Phase 2C is currently disabled in migrate-emails.js orchestration.
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

  // Bob has BOTH an old account and a new account (hard collision).
  // Alice is mixed-case to also test collation.
  const users = [
    { email: 'Alice.OLD@X.gov.sg', name: 'Alice' },
    { email: 'bob.old@x.gov.sg', name: 'Bob (old account)' },
    { email: 'bob.new@x.gov.sg', name: 'Bob (new account)' },
    { email: 'carol.old@x.gov.sg', name: 'Carol' },
    { email: 'dave@x.gov.sg', name: 'Dave' }, // untouched control
  ]
  const userInsert = await db.collection('users').insertMany(users)
  const aliceOldId = userInsert.insertedIds[0]
  const bobOldId = userInsert.insertedIds[1]
  const bobNewId = userInsert.insertedIds[2]

  // F0: owned by bob.old — should be reassigned to bob.new in Phase 1.
  // F1/F2/F3/F4: cover 2A, 2B, 2C-i, 2C-ii respectively (2C disabled in CLI).
  // F5: control.
  const formInsert = await db.collection('forms').insertMany([
    {
      title: 'F0-owned-by-bob-old',
      admin: bobOldId,
      responseMode: 'encrypt',
      permissionList: [],
      lastModified: new Date('2026-01-00'),
    },
    {
      title: 'F1',
      responseMode: 'encrypt',
      permissionList: [
        { email: 'Alice.OLD@X.gov.sg', write: false },
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
  const f0Id = formInsert.insertedIds[0]

  await mongoose.disconnect()

  // ---------- PASS 1: add-mode ----------
  console.log('\n=== PASS 1: add-mode ===')
  // Pre-flight: 1 hard collision (bob). PROCEED prompt.
  // Phase 1: 3 users matched (alice, bob, carol). Alice/carol rename, bob reassign.
  // Phase 2A: F1.
  // Phase 2B: F2.
  runMigrate(
    [
      '--csv', csvPath,
      '--backup-root', backupRoot,
      '--phase', 'all',
      '--no-dry-run',
      '--batch-size', '5',
      '--max-writes-per-sec', '100',
    ],
    ['PROCEED 1', 'MIGRATE 3', 'MIGRATE 1', 'MIGRATE 1', ''].join('\n'),
    uri,
  )

  console.log('--- verifying PASS 1 post-state ---')
  await mongoose.connect(uri)
  const db2 = mongoose.connection.db
  assert(db2, 'db handle 2')

  // Alice renamed (mixed-case found via collation), Carol renamed, both Bob accounts intact.
  const uAlice = requireDoc(
    await db2.collection('users').findOne({ _id: aliceOldId }),
    'Alice',
  )
  assert(uAlice.email === 'alice.new@x.gov.sg', `Alice email: ${uAlice.email}`)
  const uBobOld = requireDoc(
    await db2.collection('users').findOne({ _id: bobOldId }),
    'BobOld',
  )
  assert(
    uBobOld.email === 'bob.old@x.gov.sg',
    `BobOld still has old email (not renamed): ${uBobOld.email}`,
  )
  const uBobNew = requireDoc(
    await db2.collection('users').findOne({ _id: bobNewId }),
    'BobNew',
  )
  assert(uBobNew.email === 'bob.new@x.gov.sg', `BobNew untouched: ${uBobNew.email}`)
  const uDave = requireDoc(
    await db2.collection('users').findOne({ _id: userInsert.insertedIds[4] }),
    'Dave',
  )
  assert(uDave.email === 'dave@x.gov.sg', `Dave untouched: ${uDave.email}`)

  // F0 admin reassigned from BobOld to BobNew.
  const f0 = requireDoc(await db2.collection('forms').findOne({ _id: f0Id }), 'F0')
  assert(
    String(f0.admin) === String(bobNewId),
    `F0 admin reassigned to BobNew (${String(bobNewId)}), got ${String(f0.admin)}`,
  )

  // F1: alice.new added; bob already had both old and new.
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

  // F2: carol.new appended.
  const f2Add = requireDoc(await db2.collection('forms').findOne({ title: 'F2' }), 'F2 add')
  assert(
    JSON.stringify(f2Add.emails) ===
      JSON.stringify(['carol.old@x.gov.sg', 'other@x.gov.sg', 'carol.new@x.gov.sg']),
    `F2 add emails: ${JSON.stringify(f2Add.emails)}`,
  )

  await mongoose.disconnect()

  // ---------- PASS 2: replace-mode ----------
  console.log('\n=== PASS 2: replace-mode ===')
  // Pre-flight: alice/carol oldEmails missing (renamed); bob still has both
  // accounts (hard collision again). --allow-missing skips the PROCEED prompt.
  // Phase 1: 1 user matched (bob.old still has old email). Reassign — no-op
  //   (F0 already moved). Audit logs the reassign attempt for 0 forms.
  //   countDocuments returns 1 -> "MIGRATE 1".
  // Phase 2A: 1 form (F1 still contains old emails). Collisions silently merge.
  // Phase 2B: 1 form (F2). Collision silently merges.
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
    ['MIGRATE 1', 'MIGRATE 1', 'MIGRATE 1', ''].join('\n'),
    uri,
  )

  console.log('--- verifying PASS 2 post-state ---')
  await mongoose.connect(uri)
  const db3 = mongoose.connection.db
  assert(db3, 'db handle 3')

  // F1 collapsed via silent merge: alice.new, bob.new (write=true from merge), unrelated.
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

  // F2 collapsed.
  const f2Rep = requireDoc(await db3.collection('forms').findOne({ title: 'F2' }), 'F2 replace')
  assert(
    JSON.stringify(f2Rep.emails) ===
      JSON.stringify(['carol.new@x.gov.sg', 'other@x.gov.sg']),
    `F2 replace emails: ${JSON.stringify(f2Rep.emails)}`,
  )

  // Two backup dirs.
  const dirs = fs.readdirSync(backupRoot).sort()
  assert(dirs.length === 2, `expected 2 backup dirs, got ${dirs.length}`)

  await mongoose.disconnect()
  await mongod.stop()

  console.log('\nSMOKE TEST PASSED (add + replace + hard-collision reassignment)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
