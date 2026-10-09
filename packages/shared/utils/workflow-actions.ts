export const WORKFLOW_ACTIONS_CUTOFF = new Date('2026-10-07T14:30:00+08:00')

export const isWorkflowActionsEligible = (
  submissionCreated: Date | string | undefined,
): boolean => {
  if (submissionCreated === undefined) return false
  const created = new Date(submissionCreated).getTime()
  return !Number.isNaN(created) && created >= WORKFLOW_ACTIONS_CUTOFF.getTime()
}
