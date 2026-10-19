import { renderHook } from '@testing-library/react'

import { featureFlags } from 'formsg-shared/constants'

import {
  useWorkflowActionsGate,
  useWorkflowActionsSendBackGate,
} from './useWorkflowActionsGate'

let mockFlagsOn: string[] = []

vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: (flag: string) => mockFlagsOn.includes(flag),
}))

describe('useWorkflowActionsGate', () => {
  it('is on with the flag on', () => {
    mockFlagsOn = [featureFlags.workflowActions]
    const { result } = renderHook(() => useWorkflowActionsGate())
    expect(result.current).toBe(true)
  })

  it('is off with the flag off', () => {
    mockFlagsOn = [featureFlags.workflowActionsSendBack]
    const { result } = renderHook(() => useWorkflowActionsGate())
    expect(result.current).toBe(false)
  })
})

describe('useWorkflowActionsSendBackGate', () => {
  it('follows its own flag, not the workflow actions flag', () => {
    mockFlagsOn = [featureFlags.workflowActionsSendBack]
    expect(
      renderHook(() => useWorkflowActionsSendBackGate()).result.current,
    ).toBe(true)

    mockFlagsOn = [featureFlags.workflowActions]
    expect(
      renderHook(() => useWorkflowActionsSendBackGate()).result.current,
    ).toBe(false)
  })
})
