import { FormWorkflowStep, WorkflowType } from '../../types'
import {
  getRunnableWorkflow,
  isFirstStepPlaceholder,
} from '../runnable-workflow'

const step = (overrides: Partial<FormWorkflowStep> = {}): FormWorkflowStep =>
  ({
    workflow_type: WorkflowType.Static,
    emails: [],
    edit: [],
    ...overrides,
  }) as FormWorkflowStep

const placeholder = () => step({ isPlaceholder: true })

describe('isFirstStepPlaceholder', () => {
  it('should return true when the first step is a placeholder', () => {
    expect(isFirstStepPlaceholder([placeholder(), step()])).toBe(true)
  })

  it('should return false when the first step is set up', () => {
    expect(isFirstStepPlaceholder([step(), step()])).toBe(false)
  })

  it('should return false for an empty workflow', () => {
    expect(isFirstStepPlaceholder([])).toBe(false)
  })

  it('should return false for an undefined workflow', () => {
    expect(isFirstStepPlaceholder(undefined)).toBe(false)
  })

  it('should return false when a later step is a placeholder', () => {
    expect(isFirstStepPlaceholder([step(), placeholder()])).toBe(false)
  })
})

describe('getRunnableWorkflow', () => {
  it('should return an empty workflow when the first step is a placeholder', () => {
    expect(getRunnableWorkflow([placeholder(), step(), step()])).toEqual([])
  })

  it('should return an empty workflow when the placeholder is the only step', () => {
    expect(getRunnableWorkflow([placeholder()])).toEqual([])
  })

  it('should return the workflow unchanged when the first step is set up', () => {
    const workflow = [step({ step_name: 'Requestor' }), step()]
    expect(getRunnableWorkflow(workflow)).toBe(workflow)
  })

  it('should return the workflow unchanged when only a later step is a placeholder', () => {
    // Unreachable through the delete endpoint. Stopping the workflow here would
    // disable it for a reason the admin could not see, so we leave it alone.
    const workflow = [step(), placeholder()]
    expect(getRunnableWorkflow(workflow)).toBe(workflow)
  })

  it('should return an empty workflow for an empty workflow', () => {
    expect(getRunnableWorkflow([])).toEqual([])
  })

  it('should return an empty workflow for an undefined workflow', () => {
    expect(getRunnableWorkflow(undefined)).toEqual([])
  })
})
