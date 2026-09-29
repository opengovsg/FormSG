import { FormAuthType, WorkflowStepLoginInput } from 'formsg-shared/types'
import { FormLoginFields } from 'formsg-shared/utils/workflow-auth'

import { EditStepInputs, FirstStepLoginDraft } from '../../../types'

/** Step 1's saved form-level login, as the editor's starting draft. */
export const toFirstStepLoginDraft = (
  form: FormLoginFields,
): FirstStepLoginDraft => {
  const hasLogin = form.authType !== FormAuthType.NIL
  return {
    authType: form.authType,
    isSubmitterIdCollectionEnabled:
      hasLogin && !!form.isSubmitterIdCollectionEnabled,
    isSingleSubmission: hasLogin && !!form.isSingleSubmission,
  }
}

/** A later step's login once saved: the staged change if any, otherwise the saved one. */
export const getEditedLaterStepAuth = (
  inputs: Pick<Partial<EditStepInputs>, 'auth' | 'login_auth'>,
): WorkflowStepLoginInput | null => {
  if (inputs.login_auth !== undefined) return inputs.login_auth
  return inputs.auth
    ? {
        auth_type: inputs.auth.auth_type,
        is_submitter_id_collection_enabled:
          inputs.auth.is_submitter_id_collection_enabled,
      }
    : null
}

/** The provider a step will have once saved; step 1 may be a legacy provider. */
export const getEditedStepAuthType = (
  form: FormLoginFields,
  isFirstStep: boolean,
  inputs: Pick<
    Partial<EditStepInputs>,
    'auth' | 'login_auth' | 'first_step_login'
  >,
): FormAuthType =>
  isFirstStep
    ? (inputs.first_step_login?.authType ?? form.authType)
    : (getEditedLaterStepAuth(inputs)?.auth_type ?? FormAuthType.NIL)
