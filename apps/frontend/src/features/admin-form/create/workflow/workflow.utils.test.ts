import { WorkflowType } from 'formsg-shared/types/form'

import { isStepCompleted } from './workflow.utils'

describe('isStepCompleted', () => {
  it('should return true for a completed static step', () => {
    expect(
      isStepCompleted(
        {
          workflow_type: WorkflowType.Static,
          edit: ['field1'],
          emails: ['user@example.com'],
        },
        1,
      ),
    ).toBe(true)
  })

  it('should return true for a completed dynamic step', () => {
    expect(
      isStepCompleted(
        {
          workflow_type: WorkflowType.Dynamic,
          edit: ['field1'],
          field: 'emailFieldId',
        },
        1,
      ),
    ).toBe(true)
  })

  it('should return true for a completed conditional step', () => {
    expect(
      isStepCompleted(
        {
          workflow_type: WorkflowType.Conditional,
          edit: ['field1'],
          conditional_field: 'condFieldId',
        },
        1,
      ),
    ).toBe(true)
  })

  it('should return false when edit is empty', () => {
    expect(
      isStepCompleted(
        {
          workflow_type: WorkflowType.Static,
          edit: [],
          emails: ['user@example.com'],
        },
        1,
      ),
    ).toBe(false)
  })

  it('should return false for a static step with no respondent', () => {
    expect(
      isStepCompleted(
        {
          workflow_type: WorkflowType.Static,
          edit: ['field1'],
          emails: [],
        },
        1,
      ),
    ).toBe(false)
  })

  // The first step's respondent is always "anyone who has access to your
  // form", stored as a Static step with no emails. It counts as completed once
  // it has fields, otherwise the trigger would need three steps to fire.
  it('should return true for the first step despite having no emails', () => {
    expect(
      isStepCompleted(
        {
          workflow_type: WorkflowType.Static,
          edit: ['field1'],
          emails: [],
        },
        0,
      ),
    ).toBe(true)
  })

  it('should return false for the first step when it has no fields', () => {
    expect(
      isStepCompleted(
        {
          workflow_type: WorkflowType.Static,
          edit: [],
          emails: [],
        },
        0,
      ),
    ).toBe(false)
  })
})
