// Picks the story files a PR can affect, so CI only screenshots those.
//
// Usage: node scripts/storybook-affected.mjs <base-rev> <preview-stats.json>
// (run from apps/frontend, after `storybook build --stats-json`)
//
// Writes to $GITHUB_OUTPUT:
//   full=true|false   screenshot everything (no selection possible)
//   stories=<paths>   space-separated story files to run when full=false
//
// Selection walks the bundler's module graph from each changed file up to the
// stories that import it. Anything that reaches .storybook/ (the preview, i.e.
// theme, i18n, msw handlers) can restyle every story, so it runs them all.
// Vitest's own `--changed` cannot do this: the preview is outside a story's
// import graph, and its transitive imports are too many to list by hand.
//
// ponytail: file-level only. A changed file that is not in the graph is assumed
// unused by stories, and a dependency bump (lockfile) always runs everything.
import { execFileSync } from 'node:child_process'
import { appendFileSync, readFileSync } from 'node:fs'
import path from 'node:path'

// Paths that can alter the Storybook bundle or its toolchain. Everything else
// (backend, e2e, docs) cannot change a snapshot.
const isRelevant = (p) =>
  /^(apps\/frontend\/|packages\/|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|package\.json$|\.github\/workflows\/argos\.yml$)/.test(
    p,
  ) && !p.endsWith('.md')
// Source files nothing in the story graph imports cannot change a snapshot.
const isAppSource = (p) =>
  p.startsWith('apps/frontend/src/') && /\.[cm]?[jt]sx?$/.test(p)

const isStory = (name) => /\.(stories\.[jt]sx?|mdx)$/.test(name)
const isPreview = (name) => name.startsWith('./.storybook/') && !isStory(name)
const strip = (name) => name.replace(/\?.*$/, '')

/**
 * @param changed repo-relative paths changed since the merge base
 * @param modules `modules` from preview-stats.json (names relative to cwd)
 * @param toModuleName maps a repo-relative path to a stats module name
 * @returns `{ full: true }` or `{ full: false, stories: string[] }`
 */
export function select(changed, modules, toModuleName) {
  const importers = new Map() // module name -> Set of importer names
  for (const { name, reasons = [] } of modules) {
    for (const { moduleName } of reasons) {
      if (!moduleName || moduleName.startsWith('/virtual:')) continue
      const key = strip(name)
      if (!importers.has(key)) importers.set(key, new Set())
      importers.get(key).add(strip(moduleName))
    }
  }
  const known = new Set(modules.map((m) => strip(m.name)))

  const queue = []
  for (const p of changed) {
    if (!isRelevant(p)) continue
    const name = toModuleName(p)
    if (known.has(name)) queue.push(name)
    else if (!isAppSource(p)) return { full: true }
  }

  const stories = new Set()
  const seen = new Set()
  while (queue.length) {
    const name = queue.pop()
    if (seen.has(name)) continue
    seen.add(name)
    if (isPreview(name)) return { full: true }
    if (isStory(name)) stories.add(name.replace(/^\.\//, ''))
    for (const importer of importers.get(name) ?? []) queue.push(importer)
  }
  return { full: false, stories: [...stories].sort() }
}

if (import.meta.main) {
  const [baseRev, statsPath] = process.argv.slice(2)
  const cwd = process.cwd()
  const git = (...args) =>
    execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 })

  const repoRoot = git('rev-parse', '--show-toplevel').trim()
  const mergeBase = git('merge-base', baseRev, 'HEAD').trim()
  const changed = git(
    'diff',
    '--name-only',
    '--no-renames',
    '-z',
    mergeBase,
    'HEAD',
  )
    .split('\0')
    .filter(Boolean)

  // Module names in the stats are relative to apps/frontend, e.g. ./src/a.tsx.
  const toModuleName = (p) => {
    const rel = path.relative(cwd, path.join(repoRoot, p))
    return rel.startsWith('.') ? rel : `./${rel}`
  }
  const { modules } = JSON.parse(readFileSync(statsPath, 'utf8'))
  const result = select(changed, modules, toModuleName)

  console.log(
    result.full
      ? 'Full run: a change is outside the story graph or reaches the preview'
      : `Affected story files: ${result.stories.length}`,
  )
  const lines = `full=${result.full}\nstories=${(result.stories ?? []).join(' ')}\n`
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, lines)
  else process.stdout.write(lines)
}
