import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
} from 'formsg-shared/types'
import { canConvertSubmitterIdCollection } from 'formsg-shared/utils/login-identity'
import { formUsesAuthType } from 'formsg-shared/utils/step-login'

type StepLoginAvailabilityForm = Pick<
  AdminFormDto,
  'authType' | 'responseMode' | 'isSubmitterIdCollectionEnabled'
>

/**
 * Whether Steps 2+ may carry their own login. Hidden, not disabled, while the
 * rollout flag is off or the legacy "Collect NRIC/FIN/UENs" toggle still has
 * to be converted: that toggle only records Step 1's login.
 */
export const isLaterStepLoginAvailable = (
  form: StepLoginAvailabilityForm | undefined,
  isFlagOn: boolean,
): boolean =>
  isFlagOn &&
  !!form &&
  form.responseMode === FormResponseMode.Multirespondent &&
  !canConvertSubmitterIdCollection(form)

/**
 * Whether Step 1 or, once later-step logins are available, any later step
 * uses the login. With the flag off this is the form-level login, as today.
 */
export const formUsesLogin = ({
  form,
  authType,
  isFlagOn,
}: {
  form: AdminFormDto | undefined
  authType: FormAuthType
  isFlagOn: boolean
}): boolean => {
  if (!form) return false
  if (!isLaterStepLoginAvailable(form, isFlagOn)) {
    return form.authType === authType
  }
  return formUsesAuthType(form, authType)
}
