import { renderHook } from '@testing-library/react'

import { useWorkflowActionsGate } from './useWorkflowActionsGate'

let mockIsFlagOn = true

vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: () => mockIsFlagOn,
}))

describe('useWorkflowActionsGate', () => {
  afterEach(() => {
    mockIsFlagOn = true
  })

  it('is on with the flag on', () => {
    const { result } = renderHook(() => useWorkflowActionsGate())
    expect(result.current).toBe(true)
  })

  it('is off with the flag off', () => {
    mockIsFlagOn = false
    const { result } = renderHook(() => useWorkflowActionsGate())
    expect(result.current).toBe(false)
  })
})
