// @ts-check
'use strict'

const fs = require('fs')
const path = require('path')
const { EJSON } = require('bson')

/** @typedef {import('./types').AuditRecord} AuditRecord */

function utcStamp() {
  // Keep milliseconds so back-to-back runs don't collide.
  return new Date().toISOString().replace(/[:.]/g, '-')
}

class BackupStore {
  /**
   * @param {{ backupRoot?: string, reuseDir?: boolean, dir?: string | null, dryRun?: boolean }} opts
   */
  constructor(opts) {
    const { backupRoot, reuseDir, dir, dryRun } = opts
    if (reuseDir) {
      if (!dir) throw new Error('reuseDir requires dir')
      this.dir = dir
      if (!fs.existsSync(this.dir)) {
        throw new Error(`--resume dir does not exist: ${this.dir}`)
      }
    } else {
      if (!backupRoot) throw new Error('backupRoot required')
      fs.mkdirSync(backupRoot, { recursive: true })
      this.dir = path.join(backupRoot, utcStamp())
      fs.mkdirSync(this.dir, { recursive: false })
    }
    this.usersDir = path.join(this.dir, 'users')
    this.formsDir = path.join(this.dir, 'forms')
    fs.mkdirSync(this.usersDir, { recursive: true })
    fs.mkdirSync(this.formsDir, { recursive: true })

    this.dryRun = !!dryRun
    this.auditPath = path.join(this.dir, 'audit.ndjson')
    this.manifestPath = path.join(this.dir, 'manifest.json')

    this.auditFd = fs.openSync(this.auditPath, 'a')
    this._pendingFsync = false
  }

  /** @param {Record<string, unknown>} meta */
  writeManifest(meta) {
    const payload = {
      started_at: new Date().toISOString(),
      ...meta,
    }
    fs.writeFileSync(this.manifestPath, JSON.stringify(payload, null, 2))
  }

  /** @param {{ _id: unknown } & Record<string, unknown>} doc */
  snapshotUser(doc) {
    this._snapshot(this.usersDir, doc)
  }

  /** @param {{ _id: unknown } & Record<string, unknown>} doc */
  snapshotForm(doc) {
    this._snapshot(this.formsDir, doc)
  }

  /**
   * @param {string} dir
   * @param {{ _id: unknown } & Record<string, unknown>} doc
   */
  _snapshot(dir, doc) {
    if (!doc || !doc._id) throw new Error('snapshot requires doc with _id')
    const target = path.join(dir, `${String(doc._id)}.json`)
    if (fs.existsSync(target)) return
    const serialized = EJSON.stringify(doc, undefined, 2, { relaxed: false })
    const tmp = target + '.tmp'
    fs.writeFileSync(tmp, serialized)
    fs.renameSync(tmp, target)
  }

  /** @param {AuditRecord} record */
  audit(record) {
    const enriched = { ts: new Date().toISOString(), ...record }
    const line = JSON.stringify(enriched) + '\n'
    fs.writeSync(this.auditFd, line)
    this._pendingFsync = true
  }

  flushBatch() {
    if (this._pendingFsync) {
      fs.fsyncSync(this.auditFd)
      this._pendingFsync = false
    }
  }

  close() {
    this.flushBatch()
    fs.closeSync(this.auditFd)
  }

  /** @returns {AuditRecord[]} */
  readAudit() {
    const raw = fs.readFileSync(this.auditPath, 'utf8')
    /** @type {AuditRecord[]} */
    const out = []
    for (const line of raw.split('\n')) {
      const s = line.trim()
      if (!s) continue
      out.push(JSON.parse(s))
    }
    return out
  }
}

module.exports = { BackupStore, utcStamp }
