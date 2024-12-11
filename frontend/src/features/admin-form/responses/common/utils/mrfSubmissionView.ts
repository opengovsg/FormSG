/** Gets the business friendly string for current step of workflow. */
export const getCurrentStepString = (
  workflowCurrentStepNumber: number | undefined,
  workflowNumTotalSteps: number | undefined,
) =>
  workflowCurrentStepNumber && workflowNumTotalSteps
    ? `Step ${workflowCurrentStepNumber} of ${workflowNumTotalSteps}`
    : ''
