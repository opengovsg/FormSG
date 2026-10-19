// Run with: node --test scripts/storybook-affected.check.mjs
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { select } from './storybook-affected.mjs'

const mod = (name, ...importers) => ({
  name,
  reasons: importers.map((moduleName) => ({ moduleName })),
})
const modules = [
  mod('./src/a.stories.tsx', '/virtual:/storybook-stories.js'),
  mod('./src/b.stories.tsx', '/virtual:/storybook-stories.js'),
  mod('./src/Button.tsx', './src/a.stories.tsx', './src/b.stories.tsx'),
  mod('./src/Card.tsx', './src/b.stories.tsx'),
  mod('./src/theme/index.ts', './.storybook/preview.tsx'),
  mod('./.storybook/preview.tsx', '/virtual:/preview.js'),
]
const run = (...changed) =>
  select(changed, modules, (p) => `./${p.replace('apps/frontend/', '')}`)

test('a component selects only the stories that import it', () => {
  assert.deepEqual(run('apps/frontend/src/Card.tsx'), {
    full: false,
    stories: ['src/b.stories.tsx'],
  })
  assert.deepEqual(run('apps/frontend/src/Button.tsx').stories, [
    'src/a.stories.tsx',
    'src/b.stories.tsx',
  ])
})

test('a story edit selects itself', () => {
  assert.deepEqual(run('apps/frontend/src/a.stories.tsx').stories, [
    'src/a.stories.tsx',
  ])
})

test('anything the preview imports runs everything', () => {
  assert.equal(run('apps/frontend/src/theme/index.ts').full, true)
  assert.equal(run('apps/frontend/.storybook/preview.tsx').full, true)
})

test('source outside the graph and unrelated paths select nothing', () => {
  assert.deepEqual(run('apps/frontend/src/unused.ts'), {
    full: false,
    stories: [],
  })
  assert.deepEqual(run('apps/backend/src/x.ts', 'docs/readme.md'), {
    full: false,
    stories: [],
  })
})

test('config, assets and dependency changes run everything', () => {
  assert.equal(run('apps/frontend/vitest.config.ts').full, true)
  assert.equal(run('apps/frontend/public/logo.svg').full, true)
  assert.equal(run('pnpm-lock.yaml').full, true)
})
