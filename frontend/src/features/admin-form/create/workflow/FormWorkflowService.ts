/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  FormSettings,
  FormWorkflow,
  FormWorkflowStep,
  MultirespondentFormSettings,
} from '~shared/types/form'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const updateFormWorkflow = async (
  formId: string,
  newWorkflowSettings: MultirespondentFormSettings['workflow'],
) => {
  return ApiService.patch<FormSettings>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/settings`,
    { workflow: newWorkflowSettings },
  ).then(({ data }) => data)
}

export const createWorkflowStep = (
  formId: string,
  formWorkflow: FormWorkflow,
  createStepBody: FormWorkflowStep,
  //@ts-ignore
) => updateFormWorkflow(formId, [...formWorkflow, createStepBody])

export const deleteWorkflowStep = (
  formId: string,
  formWorkflow: FormWorkflow,
  stepNumber: number,
) => {
  formWorkflow.splice(stepNumber, 1)
  //@ts-ignore
  return updateFormWorkflow(formId, formWorkflow)
}

export const updateWorkflowStep = (
  formId: string,
  formWorkflow: FormWorkflow,
  stepNumber: number,
  updateStepBody: FormWorkflowStep,
) => {
  formWorkflow.splice(stepNumber, 1, updateStepBody)
  //@ts-ignore
  return updateFormWorkflow(formId, formWorkflow)
}
