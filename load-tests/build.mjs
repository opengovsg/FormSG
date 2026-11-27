import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { build } from 'esbuild'

const SCENARIO_DIR = 'src/scenarios'

const entryPoints = readdirSync(SCENARIO_DIR)
  .filter((file) => file.endsWith('.ts'))
  .map((file) => join(SCENARIO_DIR, file))

if (entryPoints.length === 0) {
  throw new Error(`No scenarios found in ${SCENARIO_DIR}`)
}

await build({
  entryPoints,
  outdir: 'build/scenarios',
  bundle: true,
  format: 'cjs',
  platform: 'neutral',
  target: 'es2021',
  external: ['k6', 'k6/*', 'https://*'],
  sourcemap: true,
  minify: false,
  logLevel: 'info',
})
