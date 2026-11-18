import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
  WorkflowStepAuthType,
} from 'formsg-shared/types'
import { canConvertSubmitterIdCollection } from 'formsg-shared/utils/login-identity'
import {
  formUsesAuthType,
  StepLoginStep,
  usesStepLoginRules,
} from 'formsg-shared/utils/step-login'

export const STEP_LOGIN_LABEL_KEYS = {
  [FormAuthType.MyInfo]:
    'features.adminForm.sidebar.workflow.stepLogin.singpass',
  [FormAuthType.CP]: 'features.adminForm.sidebar.workflow.stepLogin.corppass',
} as const satisfies Record<WorkflowStepAuthType, string>

type StepLoginAvailabilityForm = Pick<
  AdminFormDto,
  'authType' | 'responseMode' | 'isSubmitterIdCollectionEnabled'
> & { workflow?: readonly StepLoginStep[] | null }

/**
 * Whether Steps 2+ may carry their own login. The rollout flag only gates
 * starting: a form that already has a later-step login keeps it visible.
 * Hidden, not disabled, while the legacy "Collect NRIC/FIN/UENs" toggle still
 * has to be converted: that toggle only records Step 1's login.
 */
export const isLaterStepLoginAvailable = (
  form: StepLoginAvailabilityForm | undefined,
  isFlagOn: boolean,
): boolean =>
  !!form &&
  form.responseMode === FormResponseMode.Multirespondent &&
  usesStepLoginRules(form.workflow, isFlagOn) &&
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
