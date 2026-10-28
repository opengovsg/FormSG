import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
} from 'formsg-shared/types'
import { StepLoginForm } from 'formsg-shared/utils/step-login'

/**
 * Only CorpPass requires esrvcid as other options will use FormSG's
 * supplied value to increase Singpass Myinfo adoption
 * @param authType
 * @returns
 */

export const isEsrvcidRequired = (authType: FormAuthType) => {
  switch (authType) {
    case FormAuthType.CP:
      return true
    default:
      return false
  }
}

/**
 * Whether a step after Step 1 logs in with Corppass but has no e-service ID
 * yet. Corppass checks its authorisation list against that ID, so the form
 * cannot open until every Corppass step has one.
 */
export const hasCorppassStepWithoutEsrvcId = (
  form: Pick<AdminFormDto, 'responseMode'> & Pick<StepLoginForm, 'workflow'>,
): boolean =>
  form.responseMode === FormResponseMode.Multirespondent &&
  (form.workflow ?? [])
    .slice(1)
    .some(
      (step) =>
        step.auth?.auth_type === FormAuthType.CP && !step.auth.esrvc_id?.trim(),
    )
