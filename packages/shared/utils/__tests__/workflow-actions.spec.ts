import {
  isWorkflowActionsEligible,
  WORKFLOW_ACTIONS_CUTOFF,
} from '../workflow-actions'

describe('isWorkflowActionsEligible', () => {
  it('is eligible at the cutoff', () => {
    expect(isWorkflowActionsEligible(WORKFLOW_ACTIONS_CUTOFF)).toBe(true)
  })

  it('is eligible after the cutoff', () => {
    expect(isWorkflowActionsEligible('2026-10-07T06:30:01.000Z')).toBe(true)
  })

  it('is not eligible before the cutoff', () => {
    expect(isWorkflowActionsEligible('2026-10-07T06:29:59.999Z')).toBe(false)
  })

  it('is not eligible without a valid date', () => {
    expect(isWorkflowActionsEligible(undefined)).toBe(false)
    expect(isWorkflowActionsEligible('not a date')).toBe(false)
  })
})
