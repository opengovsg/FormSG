import { WorkflowType } from 'formsg-shared/types/form'

import { isStepCompleted } from './workflow.utils'

describe('isStepCompleted', () => {
  describe('static steps', () => {
    it('should return true when step has fields and emails', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Static,
          edit: ['field1'],
          emails: ['user@example.com'],
        }),
      ).toBe(true)
    })

    it('should return false when step has fields but no emails', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Static,
          edit: ['field1'],
          emails: [],
        }),
      ).toBe(false)
    })

    it('should return false when step has emails but no fields', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Static,
          edit: [],
          emails: ['user@example.com'],
        }),
      ).toBe(false)
    })
  })

  describe('dynamic steps', () => {
    it('should return true when step has fields and a respondent field', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Dynamic,
          edit: ['field1'],
          field: 'emailFieldId',
        }),
      ).toBe(true)
    })

    it('should return false when step has fields but no respondent field', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Dynamic,
          edit: ['field1'],
          field: '',
        }),
      ).toBe(false)
    })

    it('should return false when step has respondent field but no fields', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Dynamic,
          edit: [],
          field: 'emailFieldId',
        }),
      ).toBe(false)
    })
  })

  describe('conditional steps', () => {
    it('should return true when step has fields and a conditional field', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Conditional,
          edit: ['field1'],
          conditional_field: 'condFieldId',
        }),
      ).toBe(true)
    })

    it('should return false when step has fields but no conditional field', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Conditional,
          edit: ['field1'],
          conditional_field: '',
        }),
      ).toBe(false)
    })

    it('should return false when step has conditional field but no fields', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Conditional,
          edit: [],
          conditional_field: 'condFieldId',
        }),
      ).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should return true with multiple fields assigned', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Static,
          edit: ['field1', 'field2', 'field3'],
          emails: ['user@example.com'],
        }),
      ).toBe(true)
    })

    it('should return true with multiple emails', () => {
      expect(
        isStepCompleted({
          workflow_type: WorkflowType.Static,
          edit: ['field1'],
          emails: ['a@example.com', 'b@example.com'],
        }),
      ).toBe(true)
    })
  })
})
