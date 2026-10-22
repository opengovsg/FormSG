import { useAdminForm } from '~features/admin-form/common/queries'

import { isLaterStepLoginAvailable } from '../utils/stepLoginAvailability'

import { useIsMrfStepLoginEnabled } from './useIsMrfStepLoginEnabled'

/** See `isLaterStepLoginAvailable`. */
export const useIsLaterStepLoginAvailable = (): boolean => {
  const { data: form } = useAdminForm()
  const isFlagOn = useIsMrfStepLoginEnabled()
  return isLaterStepLoginAvailable(form, isFlagOn)
}
