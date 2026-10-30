import {
  FormWorkflowDto,
  FormWorkflowStepWriteDto,
  WorkflowStepAuthType,
} from 'formsg-shared/types/form'

import { ApiService } from '~services/ApiService'

import { ADMIN_FORM_ENDPOINT } from '~features/admin-form/common/AdminViewFormService'

export const createWorkflowStep = (
  formId: string,
  createStepBody: FormWorkflowStepWriteDto,
) => {
  return ApiService.post<FormWorkflowDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/workflow`,
    createStepBody,
  ).then(({ data }) => data)
}

export interface AuthFieldDeletionConfirmation {
  expected_last_modified?: string
  delete_auth_field_ids?: string[]
}
export interface DeleteWorkflowOptions extends AuthFieldDeletionConfirmation {
  retained_auth_type?: WorkflowStepAuthType
  retained_esrvc_id?: string
}

export const deleteWorkflowStep = (
  formId: string,
  stepNumber: number,
  confirmation?: AuthFieldDeletionConfirmation,
) => {
  return ApiService.delete<FormWorkflowDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/workflow/${stepNumber}`,
    { data: confirmation },
  ).then(({ data }) => data)
}

/**
 * Deletes the form's entire workflow.
 *
 * Also what deleting step 1 means — the API refuses to delete step 1 on its own
 * precisely so that this is the only way to express it.
 */
export const deleteWorkflow = (
  formId: string,
  options?: DeleteWorkflowOptions,
) => {
  return ApiService.delete<FormWorkflowDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/workflow`,
    { data: options },
  ).then(({ data }) => data)
}

export const updateWorkflowStep = (
  formId: string,
  stepNumber: number,
  updateStepBody: FormWorkflowStepWriteDto,
) => {
  return ApiService.put<FormWorkflowDto>(
    `${ADMIN_FORM_ENDPOINT}/${formId}/workflow/${stepNumber}`,
    updateStepBody,
  ).then(({ data }) => data)
}
