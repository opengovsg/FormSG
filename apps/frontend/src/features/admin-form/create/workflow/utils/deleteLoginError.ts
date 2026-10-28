import { AdminFormDto, FormResponseMode } from 'formsg-shared/types'
import { getResultingLoginErrors } from 'formsg-shared/utils/step-login'

/**
 * Why deleting would leave login-filled fields without a login to fill them,
 * if it would. Mirrors the API's check on workflow and step deletes.
 * `stepNumber` is the step to delete; without it, the whole workflow goes.
 */
export const getDeleteLoginError = (
  form: AdminFormDto | undefined,
  stepNumber?: number,
): string | undefined => {
  if (!form || form.responseMode !== FormResponseMode.Multirespondent) return
  const workflow = form.workflow ?? []
  const resultingWorkflow =
    stepNumber === undefined
      ? []
      : workflow.filter((_step, index) => index !== stepNumber)
  const errors = getResultingLoginErrors({
    authType: form.authType,
    responseMode: form.responseMode,
    isSubmitterIdCollectionEnabled: form.isSubmitterIdCollectionEnabled,
    form_fields: form.form_fields,
    workflow: resultingWorkflow,
  })
  return errors.length > 0 ? errors.join(' ') : undefined
}
