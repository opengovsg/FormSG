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

/**
 * Reorder workflow steps by swapping two positions.
 * No dedicated backend endpoint exists, so this updates both steps sequentially.
 * Returns the final workflow state.
 */
export const reorderWorkflowSteps = async (
  formId: string,
  fromIndex: number,
  toIndex: number,
  steps: FormWorkflowStep[],
): Promise<FormWorkflowDto> => {
  // Build the reordered array
  const reordered = [...steps]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)

  // Update each step that changed position
  // We need to update from the end to avoid index shifting issues
  let result: FormWorkflowDto | undefined
  const start = Math.min(fromIndex, toIndex)
  const end = Math.max(fromIndex, toIndex)
  for (let i = start; i <= end; i++) {
    result = await updateWorkflowStep(formId, i, reordered[i])
  }

  if (!result) throw new Error('No steps were updated')
  return result
}
