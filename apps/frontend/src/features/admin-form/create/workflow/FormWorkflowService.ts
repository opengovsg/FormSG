import { FormWorkflowDto, FormWorkflowStep } from 'formsg-shared/types/form'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const createWorkflowStep = (
  formId: string,
  createStepBody: FormWorkflowStep,
) => {
  return ApiService.post<FormWorkflowDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/workflow`,
    createStepBody,
  ).then(({ data }) => data)
}

export const deleteWorkflowStep = (formId: string, stepNumber: number) => {
  return ApiService.delete<FormWorkflowDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/workflow/${stepNumber}`,
  ).then(({ data }) => data)
}

/**
 * Deletes the form's entire workflow.
 *
 * Also what deleting step 1 means — the API refuses to delete step 1 on its own
 * precisely so that this is the only way to express it.
 */
export const deleteWorkflow = (formId: string) => {
  return ApiService.delete<FormWorkflowDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/workflow`,
  ).then(({ data }) => data)
}

export const updateWorkflowStep = (
  formId: string,
  stepNumber: number,
  updateStepBody: FormWorkflowStep,
) => {
  return ApiService.put<FormWorkflowDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/workflow/${stepNumber}`,
    updateStepBody,
  ).then(({ data }) => data)
}
