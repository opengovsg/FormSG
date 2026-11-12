import { FormStatus } from 'formsg-shared/types'
import { getResultingLoginErrors } from 'formsg-shared/utils/step-login'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useUsesStepLoginRules } from '../workflow/hooks/useUsesStepLoginRules'

/**
 * Draft warnings use the same field rules that the server checks on publish.
 * The missing step e-service ID is left out: the form status toggle passes it
 * to the notice itself. Without step login rules there are none, as before.
 */
export const useAuthenticationPublishErrors = (): string[] => {
  const { data: form } = useAdminForm()
  // The server only runs these checks under step login rules.
  const usesStepLoginRules = useUsesStepLoginRules()
  return usesStepLoginRules && form && form.status !== FormStatus.Public
    ? getResultingLoginErrors(form)
    : []
}
