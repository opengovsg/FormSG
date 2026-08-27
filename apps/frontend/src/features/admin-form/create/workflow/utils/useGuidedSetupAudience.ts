import { useCallback, useMemo } from 'react'

import { SeenFlags } from 'formsg-shared/types'

import { useUserMutations } from '~features/user/mutations'
import { useUser } from '~features/user/queries'

/**
 * Which of the three situations an admin opening a stepless workflow tab is in.
 *
 * - `new` joined after the redesign and has never been taught the model
 * - `pre-existing` was using FormSG before the redesign, so we cannot know
 *   whether they have ever built a workflow
 * - `taught` has completed or skipped guided setup
 */
export type GuidedSetupAudience = 'new' | 'pre-existing' | 'taught'

/** The value the seed datafix writes for accounts that predate the redesign. */
export const GUIDED_SETUP_PRE_EXISTING = 0
/** The value written when an admin completes or skips guided setup. */
export const GUIDED_SETUP_TAUGHT = 1

/**
 * Prototype-only override, so every audience can be demonstrated without
 * editing user records.
 *
 * Append `?guidedFlag=unset`, `?guidedFlag=0` or `?guidedFlag=1` to the builder
 * URL to force the corresponding intro screen. Anything else is ignored and the
 * real flag is used.
 *
 * This is scaffolding for the reference branch. It must not ship.
 */
const OVERRIDE_PARAM = 'guidedFlag'

const readOverride = (): GuidedSetupAudience | undefined => {
  if (typeof window === 'undefined') return undefined
  const raw = new URLSearchParams(window.location.search).get(OVERRIDE_PARAM)
  switch (raw) {
    case 'unset':
      return 'new'
    case '0':
      return 'pre-existing'
    case '1':
      return 'taught'
    default:
      return undefined
  }
}

/**
 * Reads the raw flag value rather than going through
 * `getShowFeatureFlagLastSeen`, which collapses the flag to a boolean and
 * returns "show" when unset. That cannot tell unset apart from 0, and the two
 * mean different things here.
 *
 * `0` is a real value, not a falsy one. A truthiness test would treat the
 * seeded cohort as unset and impose guidance on admins who should be offered
 * a choice, so the comparison is against undefined.
 */
export const useGuidedSetupAudience = (): {
  audience: GuidedSetupAudience | undefined
  isLoading: boolean
} => {
  const { user, isLoading } = useUser()

  const audience = useMemo((): GuidedSetupAudience | undefined => {
    const override = readOverride()
    if (override) return override
    if (isLoading || !user) return undefined

    const value = user.flags?.[SeenFlags.GuidedWorkflowSetup]
    if (value === undefined || value === null) return 'new'
    return value >= GUIDED_SETUP_TAUGHT ? 'taught' : 'pre-existing'
  }, [user, isLoading])

  return { audience, isLoading }
}

/**
 * Marks the admin as taught.
 *
 * Written on completion and on skip, never on sight. An admin who opens the
 * intro screen and navigates away has not been taught anything, and should get
 * the flow again next time. Skipping counts, because skipping is an explicit
 * "I do not need this".
 */
export const useMarkGuidedSetupTaught = (): (() => void) => {
  const { updateLastSeenFlagMutation } = useUserMutations()

  return useCallback(() => {
    if (readOverride()) return
    updateLastSeenFlagMutation.mutate({
      flag: SeenFlags.GuidedWorkflowSetup,
      version: GUIDED_SETUP_TAUGHT,
    })
  }, [updateLastSeenFlagMutation])
}
