import { FormResponseMode } from 'formsg-shared/types'
import { hasLaterStepLogin } from 'formsg-shared/utils/step-login'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useIsMrfStepLoginEnabled } from './useIsMrfStepLoginEnabled'

/**
 * Mirrors the admin API: step login rules apply once the rollout flag is on,
 * or to a form that already has a later-step login so it can still be
 * maintained or removed. Other forms keep the flows from before step logins.
 */
export const useUsesStepLoginRules = (): boolean => {
  const { data: form } = useAdminForm()
  const isFlagOn = useIsMrfStepLoginEnabled()
  return (
    isFlagOn ||
    (form?.responseMode === FormResponseMode.Multirespondent &&
      hasLaterStepLogin(form.workflow))
  )
}
