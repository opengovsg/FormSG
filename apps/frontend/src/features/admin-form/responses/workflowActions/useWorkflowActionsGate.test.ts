import { renderHook } from '@testing-library/react'

import { SubmissionMrfMetadata } from 'formsg-shared/types'

import { useWorkflowActionsGate } from './useWorkflowActionsGate'

let mockIsFlagOn = true

vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: () => mockIsFlagOn,
}))

const mrf = (isWorkflowActionsEligible: boolean): SubmissionMrfMetadata => ({
  workflowCurrentStepNumber: 2,
  workflowNumTotalSteps: 3,
  workflowStatus: undefined,
  lastSubmittedAt: undefined,
  hasNextStepRecipientEmails: true,
  isWorkflowActionsEligible,
})

describe('useWorkflowActionsGate', () => {
  afterEach(() => {
    mockIsFlagOn = true
  })

  it('is on with the flag on and an eligible submission', () => {
    const { result } = renderHook(() => useWorkflowActionsGate(mrf(true)))
    expect(result.current).toBe(true)
  })

  it('is off for a submission before the cutoff', () => {
    const { result } = renderHook(() => useWorkflowActionsGate(mrf(false)))
    expect(result.current).toBe(false)
  })

  it('is off with the flag off', () => {
    mockIsFlagOn = false
    const { result } = renderHook(() => useWorkflowActionsGate(mrf(true)))
    expect(result.current).toBe(false)
  })

  it('is off without MRF metadata', () => {
    const { result } = renderHook(() => useWorkflowActionsGate(undefined))
    expect(result.current).toBe(false)
  })
})
