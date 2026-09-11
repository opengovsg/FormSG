import { clampWorkflowStep } from './clampWorkflowStep'

describe('clampWorkflowStep', () => {
  it('returns the step unchanged when it is within range', () => {
    expect(clampWorkflowStep(2, 5)).toBe(2)
  })

  it('clamps down to the last valid index when the step is above range', () => {
    expect(clampWorkflowStep(10, 5)).toBe(4)
  })

  it('clamps up to 0 when the step is negative', () => {
    expect(clampWorkflowStep(-3, 5)).toBe(0)
  })

  it('returns 0 regardless of the requested step when there are no steps', () => {
    expect(clampWorkflowStep(5, 0)).toBe(0)
  })
})
