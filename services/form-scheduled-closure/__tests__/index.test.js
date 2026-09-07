/**
 * Handler tests, run by `node --test`.
 *
 * The built-in runner rather than jest, deliberately: this service ships to
 * Lambda with exactly one dependency, and adding a test framework would put a
 * tree of dev dependencies into the lockfile for a file of about a hundred
 * lines. Node 22 is the function's own runtime, so its runner is already there.
 *
 * The handler reads its configuration at module load, so each test resets the
 * require cache and loads it afresh rather than sharing one instance.
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const Module = require('node:module')
const path = require('node:path')

const SECRET_PATH = '/stg-alt3/CRON_SCHEDULED_CLOSURE_API_SECRET'
const AUTH_HEADER = 'x-formsg-cron-scheduled-closure-secret'
const INDEX = path.join(__dirname, '..', 'index.js')

let ssmSend

// The AWS SDK is intercepted at require time, so these tests neither need it
// installed nor reach the network.
const originalLoad = Module._load
Module._load = function (request, ...rest) {
  if (request === '@aws-sdk/client-ssm') {
    return {
      SSMClient: class {
        send(command) {
          return ssmSend(command)
        }
      },
      GetParameterCommand: class {
        constructor(input) {
          this.input = input
        }
      },
    }
  }
  return originalLoad.call(this, request, ...rest)
}

/** A sweep response carrying the fields the endpoint actually returns. */
const sweep = (overrides = {}) => ({
  closedCount: 0,
  formIds: [],
  notifiedCount: 0,
  notifyFailedCount: 0,
  hasMore: false,
  ...overrides,
})

const captureConsole = () => {
  const lines = { log: [], warn: [], error: [] }
  const original = {}
  for (const level of ['log', 'warn', 'error']) {
    original[level] = console[level]
    console[level] = (...args) => lines[level].push(args.join(' '))
  }
  return {
    lines,
    restore: () => Object.assign(console, original),
  }
}

const load = (siteName = 'stg-alt3') => {
  delete require.cache[INDEX]
  process.env.AWS_REGION = 'ap-southeast-1'
  process.env.SSM_ENV_SITE_NAME = siteName
  process.env.SSM_SECRET_PARAMETER_NAME = SECRET_PATH
  ssmSend = async () => ({ Parameter: { Value: 'sekret' } })
  return require(INDEX).handler
}

/** Queues one response per sweep and records the calls made. */
const respondWith = (...bodies) => {
  const calls = []
  let i = 0
  global.fetch = async (url, init) => {
    calls.push({ url, init })
    return { ok: true, json: async () => bodies[i++] ?? sweep() }
  }
  return calls
}

test('reads the secret from the SSM path the template supplies', async () => {
  const handler = load()
  let seen
  ssmSend = async (command) => {
    seen = command.input
    return { Parameter: { Value: 'sekret' } }
  }
  respondWith(sweep())
  const c = captureConsole()

  await handler()
  c.restore()

  assert.deepEqual(seen, { Name: SECRET_PATH, WithDecryption: true })
})

test('sends the secret as the auth header to the environment host', async () => {
  const handler = load()
  const calls = respondWith(sweep())
  const c = captureConsole()

  await handler()
  c.restore()

  assert.equal(
    calls[0].url,
    'https://stg-alt3.form.gov.sg/api/v3/cron/close-expired-forms',
  )
  assert.equal(calls[0].init.method, 'POST')
  assert.equal(calls[0].init.headers[AUTH_HEADER], 'sekret')
})

test('builds a bare hostname for production', async () => {
  const handler = load('prod')
  const calls = respondWith(sweep())
  const c = captureConsole()

  await handler()
  c.restore()

  assert.equal(
    calls[0].url,
    'https://form.gov.sg/api/v3/cron/close-expired-forms',
  )
})

test('keeps sweeping while the endpoint reports more to do', async () => {
  const handler = load()
  respondWith(
    sweep({ formIds: ['a'], notifiedCount: 1, hasMore: true }),
    sweep({ formIds: ['b'], notifiedCount: 1, hasMore: true }),
    sweep({ formIds: ['c'], notifiedCount: 1, hasMore: false }),
  )
  const c = captureConsole()

  const result = await handler()
  c.restore()

  assert.equal(result.sweeps, 3)
  assert.deepEqual(result.formIds, ['a', 'b', 'c'])
  assert.equal(result.closedCount, 3)
  assert.equal(result.notifiedCount, 3)
  assert.equal(result.hasMore, false)
})

test('stops at MAX_SWEEPS_PER_RUN and says the backlog remains', async () => {
  const handler = load()
  const calls = respondWith(
    ...Array.from({ length: 6 }, () => sweep({ hasMore: true })),
  )
  const c = captureConsole()

  const result = await handler()
  c.restore()

  assert.equal(result.sweeps, 5)
  assert.equal(calls.length, 5)
  // Reported rather than swallowed, so a backlog is visible in the logs.
  assert.equal(result.hasMore, true)
  assert.equal(c.lines.warn.length, 1)
})

test('totals the notification counts across sweeps', async () => {
  const handler = load()
  respondWith(
    sweep({ notifiedCount: 2, notifyFailedCount: 1, hasMore: true }),
    sweep({ notifiedCount: 1, notifyFailedCount: 2, hasMore: false }),
  )
  const c = captureConsole()

  const result = await handler()
  c.restore()

  assert.equal(result.notifiedCount, 3)
  assert.equal(result.notifyFailedCount, 3)
})

test('says so loudly when notifications failed', async () => {
  const handler = load()
  respondWith(sweep({ notifyFailedCount: 2 }))
  const c = captureConsole()

  await handler()
  c.restore()

  // Nothing retries these, so a quiet log would lose them entirely.
  assert.equal(c.lines.error.length, 1)
  assert.match(c.lines.error[0], /2 closure notification\(s\) failed/)
})

test('stays quiet when no notification failed', async () => {
  const handler = load()
  respondWith(sweep())
  const c = captureConsole()

  await handler()
  c.restore()

  assert.equal(c.lines.error.length, 0)
})

test('throws on a non-2xx rather than reporting nothing closed', async () => {
  const handler = load()
  global.fetch = async () => ({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    text: async () => 'bad secret',
  })
  const c = captureConsole()

  await assert.rejects(handler, /401 Unauthorized: bad secret/)
  c.restore()
})

test('throws when the SSM parameter is empty, before any sweep', async () => {
  const handler = load()
  ssmSend = async () => ({ Parameter: { Value: '' } })
  const calls = respondWith(sweep())
  const c = captureConsole()

  // An empty secret would 401 every sweep, which reads the same as a quiet run
  // in CloudWatch. Fail where the cause is still visible.
  await assert.rejects(handler, /No secret found at SSM parameter/)
  c.restore()
  assert.equal(calls.length, 0)
})
