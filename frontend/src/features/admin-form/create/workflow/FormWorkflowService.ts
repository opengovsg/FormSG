import {
  FormSettings,
  FormWorkflow,
  FormWorkflowDto,
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
  // @ts-expect-error Argument of type 'FormWorkflow' is not assignable to parameter of type 'FormWorkflowDto'.
) => updateFormWorkflow(formId, [...formWorkflow, createStepBody])

export const deleteWorkflowStep = (
  formId: string,
  formWorkflow: FormWorkflowDto,
  stepNumber: number,
) => {
  formWorkflow.splice(stepNumber, 1)
  return updateFormWorkflow(formId, formWorkflow)
}

export const updateWorkflowStep = (
  formId: string,
  formWorkflow: FormWorkflowDto,
  stepNumber: number,
  updateStepBody: FormWorkflowStep,
) => {
  // @ts-expect-error Argument of type 'FormWorkflow' is not assignable to parameter of type 'FormWorkflowDto'.
  formWorkflow.splice(stepNumber, 1, updateStepBody)
  return updateFormWorkflow(formId, formWorkflow)
}
