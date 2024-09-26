import { FormWorkflowDto, FormWorkflowStep } from '~shared/types/form'

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
