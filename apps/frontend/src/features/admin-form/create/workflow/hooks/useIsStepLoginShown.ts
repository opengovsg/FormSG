import { useAdminForm } from '~features/admin-form/common/queries'

import { isFirstStepByStepNumber } from '../components/WorkflowContent/utils/isFirstStepByStepNumber'
import { isLaterStepLoginAvailable } from '../utils/stepLoginAvailability'

import { useIsMrfStepLoginEnabled } from './useIsMrfStepLoginEnabled'

/**
 * Whether a step's login block appears in the workflow editor. Step 1 shows
 * it once the flag is on (its login lives in Settings too); later steps only
 * once later-step logins are available for the form.
 */
export const useIsStepLoginShown = (stepNumber: number): boolean => {
  const { data: form } = useAdminForm()
  const isFlagOn = useIsMrfStepLoginEnabled()
  if (isFirstStepByStepNumber(stepNumber)) return isFlagOn
  return isLaterStepLoginAvailable(form, isFlagOn)
}
