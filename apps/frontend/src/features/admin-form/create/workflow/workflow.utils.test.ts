import { WorkflowType } from 'formsg-shared/types/form'

import { isStepCompleted } from './workflow.utils'

describe('isStepCompleted', () => {
  it('should return true for a completed static step', () => {
    expect(
      isStepCompleted({
        workflow_type: WorkflowType.Static,
        edit: ['field1'],
        emails: ['user@example.com'],
      }),
    ).toBe(true)
  })

  it('should return true for a completed dynamic step', () => {
    expect(
      isStepCompleted({
        workflow_type: WorkflowType.Dynamic,
        edit: ['field1'],
        field: 'emailFieldId',
      }),
    ).toBe(true)
  })

  it('should return true for a completed conditional step', () => {
    expect(
      isStepCompleted({
        workflow_type: WorkflowType.Conditional,
        edit: ['field1'],
        conditional_field: 'condFieldId',
      }),
    ).toBe(true)
  })

  it('should return false when edit is empty', () => {
    expect(
      isStepCompleted({
        workflow_type: WorkflowType.Static,
        edit: [],
        emails: ['user@example.com'],
      }),
    ).toBe(false)
  })
})
