#!/usr/bin/env node
'use strict'

/**
 * End-to-end smoke test for the email migration script.
 *
 * Spins up mongodb-memory-server, seeds users and forms covering all phases,
 * shells out to migrate-emails.js with --no-dry-run, and asserts the expected
 * post-state.
 *
 * Not for production use. Lives in this dir for convenience.
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

function assert(cond, msg) {
  if (!cond) {
    console.error(`ASSERTION FAILED: ${msg}`)
    process.exit(1)
  }
}

async function main() {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'email-mig-smoke-'))
  const csvPath = path.join(tmpRoot, 'emails.csv')
  const backupRoot = path.join(tmpRoot, 'backups')
  console.log(`tmp dir: ${tmpRoot}`)

  // CSV: header + 3 mappings.
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

  // Seed via raw mongoose connection.
  await mongoose.connect(uri)
  const db = mongoose.connection.db

  const users = [
    { email: 'alice.old@x.gov.sg', name: 'Alice' },
    { email: 'bob.old@x.gov.sg', name: 'Bob' },
    { email: 'carol.old@x.gov.sg', name: 'Carol' },
    // Untouched control user.
    { email: 'dave@x.gov.sg', name: 'Dave' },
  ]
  const userInsert = await db.collection('users').insertMany(users)

  // Forms covering every phase:
  // F1: permissionList only (2A). Includes Alice (old) + a max-rights merge case
  //     where Bob (old, read-only) and Bob's NEW email (write=true) both exist.
  // F2: admin notification emails (2B). Includes Carol; also tests shrink:
  //     ['carol.old', 'carol.new'] => ['carol.new'].
  // F3: static workflow emails (2C-i). Two static steps, one with Alice.
  // F4: conditional optionsToRecipientsMap (2C-ii). Two option keys, one with Bob.
  // F5: untouched control form.
  await db.collection('forms').insertMany([
    {
      title: 'F1',
      responseMode: 'encrypt',
      permissionList: [
        { email: 'alice.old@x.gov.sg', write: false },
        { email: 'bob.old@x.gov.sg', write: false },
        { email: 'bob.new@x.gov.sg', write: true }, // collision target
        { email: 'unrelated@x.gov.sg', write: false },
      ],
      lastModified: new Date('2026-01-01'),
    },
    {
      title: 'F2',
      responseMode: 'email',
      emails: ['carol.old@x.gov.sg', 'carol.new@x.gov.sg', 'other@x.gov.sg'],
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
        {
          _id: new mongoose.Types.ObjectId(),
          workflow_type: 'static',
          emails: ['noop@x.gov.sg'],
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

  // Run the migration.
  console.log('--- running migrate-emails.js ---')
  const result = spawnSync(
    'node',
    [
      'migrate-emails.js',
      '--csv',
      csvPath,
      '--backup-root',
      backupRoot,
      '--phase',
      'all',
      '--no-dry-run',
      '--batch-size',
      '5',
      '--max-writes-per-sec',
      '100',
    ],
    {
      cwd: __dirname,
      env: { ...process.env, DB_URI: uri, MIGRATE_ALLOW_PIPED_CONFIRM: '1' },
      stdio: ['pipe', 'inherit', 'inherit'],
      // Feed confirmation strings for every phase prompt:
      // Phase 1 (3 users), 2A (1 form), 2B (1 form), 2C-i (1 form), 2C-ii (1 form, "unknown-pre-scan").
      input: [
        'MIGRATE 3',
        'MIGRATE 1',
        'MIGRATE 1',
        'MIGRATE 1',
        'MIGRATE unknown-pre-scan',
        '',
      ].join('\n'),
    },
  )
  if (result.status !== 0) {
    console.error(`migrate-emails.js exited with status ${result.status}`)
    process.exit(result.status || 1)
  }

  // Verify post-state.
  console.log('--- verifying post-state ---')
  await mongoose.connect(uri)
  const db2 = mongoose.connection.db

  const uAlice = await db2.collection('users').findOne({ _id: userInsert.insertedIds[0] })
  assert(uAlice.email === 'alice.new@x.gov.sg', `Alice email: ${uAlice.email}`)

  const uDave = await db2.collection('users').findOne({ _id: userInsert.insertedIds[3] })
  assert(uDave.email === 'dave@x.gov.sg', `Dave untouched: ${uDave.email}`)

  const f1 = await db2.collection('forms').findOne({ title: 'F1' })
  const f1Emails = f1.permissionList.map((p) => p.email).sort()
  assert(
    JSON.stringify(f1Emails) ===
      JSON.stringify(['alice.new@x.gov.sg', 'bob.new@x.gov.sg', 'unrelated@x.gov.sg']),
    `F1 permissionList emails: ${JSON.stringify(f1Emails)}`,
  )
  const bobEntry = f1.permissionList.find((p) => p.email === 'bob.new@x.gov.sg')
  assert(bobEntry.write === true, `F1 Bob merged write rights: ${bobEntry.write}`)

  const f2 = await db2.collection('forms').findOne({ title: 'F2' })
  assert(
    JSON.stringify(f2.emails) ===
      JSON.stringify(['carol.new@x.gov.sg', 'other@x.gov.sg']),
    `F2 emails (dedupe shrink): ${JSON.stringify(f2.emails)}`,
  )

  const f3 = await db2.collection('forms').findOne({ title: 'F3' })
  assert(
    JSON.stringify(f3.form_workflows[0].emails) ===
      JSON.stringify(['alice.new@x.gov.sg', 'noop@x.gov.sg']),
    `F3 step 0 emails: ${JSON.stringify(f3.form_workflows[0].emails)}`,
  )
  assert(
    JSON.stringify(f3.form_workflows[1].emails) === JSON.stringify(['noop@x.gov.sg']),
    `F3 step 1 untouched: ${JSON.stringify(f3.form_workflows[1].emails)}`,
  )

  const f4 = await db2.collection('forms').findOne({ title: 'F4' })
  const map = f4.form_fields[0].optionsToRecipientsMap
  assert(
    JSON.stringify(map.yes) === JSON.stringify(['bob.new@x.gov.sg', 'extra@x.gov.sg']),
    `F4 'yes': ${JSON.stringify(map.yes)}`,
  )
  assert(
    JSON.stringify(map.no) === JSON.stringify(['unrelated@x.gov.sg']),
    `F4 'no' untouched: ${JSON.stringify(map.no)}`,
  )

  const f5 = await db2.collection('forms').findOne({ title: 'F5-untouched' })
  assert(
    f5.permissionList[0].email === 'unrelated@x.gov.sg',
    `F5 untouched: ${f5.permissionList[0].email}`,
  )

  // Verify backup dir exists and contains snapshots for touched docs (4 forms, 3 users).
  const dirs = fs.readdirSync(backupRoot)
  assert(dirs.length === 1, `expected 1 timestamped backup dir, got ${dirs.length}`)
  const backupDir = path.join(backupRoot, dirs[0])
  const userSnaps = fs.readdirSync(path.join(backupDir, 'users'))
  const formSnaps = fs.readdirSync(path.join(backupDir, 'forms'))
  assert(userSnaps.length === 3, `expected 3 user snapshots, got ${userSnaps.length}`)
  assert(formSnaps.length === 4, `expected 4 form snapshots, got ${formSnaps.length}`)
  assert(fs.existsSync(path.join(backupDir, 'audit.ndjson')), 'audit.ndjson exists')
  assert(fs.existsSync(path.join(backupDir, 'manifest.json')), 'manifest.json exists')

  await mongoose.disconnect()
  await mongod.stop()

  console.log('\nSMOKE TEST PASSED')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
