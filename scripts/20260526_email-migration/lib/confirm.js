// @ts-check
'use strict'

const { readLine } = require('./stdin')

/**
 * Prompt the operator to type an exact phrase before proceeding.
 * Returns true if confirmed, false otherwise.
 *
 * @param {string} phrase
 * @returns {Promise<boolean>}
 */
async function confirm(phrase) {
  const answer = await readLine(`Type '${phrase}' to continue: `)
  return answer === phrase
}

/**
 * Bounded concurrency runner. `items` are processed by `worker(item)` with at
 * most `concurrency` in-flight at a time. After every `batchSize` completed
 * items, `onBatch()` runs (used to fsync the audit log).
 *
 * Errors from a worker abort the whole run.
 *
 * @template T
 * @param {T[]} items
 * @param {{ concurrency: number, batchSize: number, onBatch?: () => (void | Promise<void>) }} opts
 * @param {(item: T) => Promise<void>} worker
 */
async function runWithConcurrency(items, opts, worker) {
  const { concurrency, batchSize, onBatch } = opts
  let cursor = 0
  let completedSinceBatch = 0
  /** @type {Set<Promise<void>>} */
  const inFlight = new Set()

  async function spawn() {
    if (cursor >= items.length) return
    const item = items[cursor++]
    /** @type {Promise<void>} */
    const p = (async () => worker(item))()
      .then(async () => {
        completedSinceBatch++
        if (completedSinceBatch >= batchSize) {
          completedSinceBatch = 0
          if (onBatch) await onBatch()
        }
      })
      .finally(() => inFlight.delete(p))
    inFlight.add(p)
  }

  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    await spawn()
  }
  while (inFlight.size > 0) {
    await Promise.race(inFlight)
    while (inFlight.size < concurrency && cursor < items.length) {
      await spawn()
    }
  }

  if (completedSinceBatch > 0 && onBatch) await onBatch()
}

module.exports = { confirm, runWithConcurrency }
