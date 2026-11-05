import { FormResponseMode } from 'formsg-shared/types'
import { usesStepLoginRules } from 'formsg-shared/utils/step-login'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useIsMrfStepLoginEnabled } from './useIsMrfStepLoginEnabled'

/** The admin API's step login rules gate, for the loaded admin form. */
export const useUsesStepLoginRules = (): boolean => {
  const { data: form } = useAdminForm()
  const isFlagOn = useIsMrfStepLoginEnabled()
  return usesStepLoginRules(
    form?.responseMode === FormResponseMode.Multirespondent
      ? form.workflow
      : undefined,
    isFlagOn,
  )
}
