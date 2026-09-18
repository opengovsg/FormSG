import { readdirSync, statSync } from 'fs'
import path from 'path'
import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config'

const TEST_FILE_PATTERN = /\.test\.tsx?$/
// .tsx tests render components and may rely on the global Storybook decorator
// (Chakra/React Query/Router/MSW) even without calling composeStories directly
// (e.g. DeleteWorkflowModal.test.tsx). Only plain .test.ts files are safely thin.
const NEEDS_STORYBOOK_PATTERN = /\.test\.tsx$/

function findTestFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry)
    if (statSync(fullPath).isDirectory()) return findTestFiles(fullPath)
    return TEST_FILE_PATTERN.test(entry) ? [fullPath] : []
  })
}

function testFilesNeedingStorybook(): string[] {
  return findTestFiles(path.join(__dirname, 'src'))
    .filter((file) => NEEDS_STORYBOOK_PATTERN.test(file))
    .map((file) => path.relative(__dirname, file))
}

const storybookTests = testFilesNeedingStorybook()

const baseTest = {
  globals: true,
  environment: 'jsdom' as const, // For storybook tests to work properly
  pool: 'threads' as const,
}

/** MSW socket teardown can throw read EINVAL when dd-trace instruments net in CI. */
function isMswSocketTeardownNoise(error: Error & { code?: string }): boolean {
  if (error.code !== 'EINVAL') return false
  const stack = error.stack ?? ''
  return (
    error.message.includes('read') ||
    stack.includes('@mswjs/interceptors') ||
    stack.includes('MockHttpSocket')
  )
}

export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
    defineConfig({
      test: {
        // Root-only options (Vitest 5 NonProjectOptions); ignored inside projects[].
        dangerouslyIgnoreUnhandledErrors: true, // there's some flakey unhandlederror surfaced by vitest, but there isn't enough information to discern if it is a real issue. Actual test failures, will still fail the tests.
        onUnhandledError(error) {
          if (isMswSocketTeardownNoise(error as Error & { code?: string })) {
            return false
          }
        },
        projects: [
          {
            extends: true,
            test: {
              ...baseTest,
              name: 'thin',
              include: ['src/**/*.test.{ts,tsx}'],
              exclude: storybookTests,
              setupFiles: ['./vitest-setup.thin.ts'],
            },
          },
          {
            extends: true,
            test: {
              ...baseTest,
              name: 'storybook',
              include: storybookTests,
              setupFiles: ['./vitest-setup.ts'],
            },
          },
        ],
      },
    }),
  ),
)
