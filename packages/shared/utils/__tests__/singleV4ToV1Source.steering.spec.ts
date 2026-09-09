import { execFileSync } from 'child_process'
import { join } from 'path'

/**
 * [STEERING:T2b] `single V4->V1 source`
 *
 * There must be exactly one V4-to-V1 flatten, it must live in the shared
 * package, and the frontend must import it from there. The whole point of
 * #9984 is that the admin surfaces and the V1 webhook producer (#9975) share
 * one producer; a second copy would drift the moment either side is touched,
 * and the differential gate would go on passing while it did.
 *
 * Delete this file once #9984 and the parity-contract review (#9750) are both
 * signed off — the differential byte-parity gate is the permanent guard.
 * Follows the `[STEERING:T2a]` precedent in
 * `apps/frontend/src/features/public-form/utils/__tests__/phase1NoOp.steering.test.ts`.
 */

const REPO_ROOT = join(__dirname, '..', '..', '..', '..')

const gitGrep = (pattern: string, ...pathspecs: string[]): string[] => {
  try {
    return execFileSync(
      'git',
      ['grep', '-l', '-e', pattern, '--', ...pathspecs],
      {
        cwd: REPO_ROOT,
        encoding: 'utf8',
      },
    )
      .split('\n')
      .filter(Boolean)
  } catch {
    // git grep exits 1 with no output when nothing matches.
    return []
  }
}

describe('[STEERING:T2b] single V4->V1 source', () => {
  it('declares the flatten exactly once, in the shared package', () => {
    expect(
      gitGrep(
        'export const flattenV4ToFormFields',
        ':(top)apps',
        ':(top)packages',
        ':(top)services',
        // The pattern is a string literal in this file too.
        ':(top,exclude)**/__tests__/**',
      ),
    ).toEqual(['packages/shared/utils/flatten-v4-to-v1.ts'])
  })

  it('leaves no copy behind in the frontend', () => {
    expect(gitGrep('flattenV4ToFormFields', ':(top)apps/frontend')).toEqual([
      'apps/frontend/src/features/admin-form/responses/ResponsesPage/storage/utils/processDecryptedContent.ts',
    ])
  })

  it('has the frontend import it from the shared package', () => {
    expect(
      gitGrep(
        "from 'formsg-shared/utils/flatten-v4-to-v1'",
        ':(top)apps/frontend',
      ),
    ).toContain(
      'apps/frontend/src/features/admin-form/responses/ResponsesPage/storage/utils/processDecryptedContent.ts',
    )
  })
})
