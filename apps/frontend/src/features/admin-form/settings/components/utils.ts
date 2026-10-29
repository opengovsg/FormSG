import {
  AdminFormDto,
  FormAuthType,
  FormResponseMode,
} from 'formsg-shared/types'
import {
  hasLaterCorppassStepWithoutEsrvcId,
  StepLoginForm,
} from 'formsg-shared/utils/step-login'

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

/** Whether a later Corppass step still needs its e-service ID before opening. */
export const hasCorppassStepWithoutEsrvcId = (
  form: Pick<AdminFormDto, 'responseMode'> & Pick<StepLoginForm, 'workflow'>,
): boolean =>
  form.responseMode === FormResponseMode.Multirespondent &&
  hasLaterCorppassStepWithoutEsrvcId(form.workflow)
