import { describe, expect, it } from 'vitest'

import { WorkflowType } from 'formsg-shared/types'

import { EditStepInputs } from '../../../types'

import { buildWorkflowStep } from './buildWorkflowStep'

const FIELD_ID = '6a7de1810000000000000001'
const DROPDOWN_ID = '6a7de1810000000000000002'

const baseInputs = (overrides: Partial<EditStepInputs> = {}) =>
  ({
    _id: 'step-1',
    workflow_type: WorkflowType.Static,
    edit: [FIELD_ID],
    emails: [],
    ...overrides,
  }) as EditStepInputs

describe('buildWorkflowStep', () => {
  // FRM-2489. Before this, a step with no respondent chosen returned undefined
  // and the save silently did nothing: no request, no error, no feedback.
  describe('a respondent that has not been chosen yet', () => {
    it('should still build a dynamic step', () => {
      const step = buildWorkflowStep(
        baseInputs({ workflow_type: WorkflowType.Dynamic }),
        false,
      )

      expect(step).toBeDefined()
      expect(step?.workflow_type).toEqual(WorkflowType.Dynamic)
    })

    it('should leave the field key out rather than sending an empty string', () => {
      const step = buildWorkflowStep(
        baseInputs({ workflow_type: WorkflowType.Dynamic, field: '' }),
        false,
      )

      // The API rejects '' and it would not cast to an ObjectId.
      expect(step).not.toHaveProperty('field')
    })

    it('should still build a conditional step', () => {
      const step = buildWorkflowStep(
        baseInputs({ workflow_type: WorkflowType.Conditional }),
        false,
      )

      expect(step).toBeDefined()
      expect(step?.workflow_type).toEqual(WorkflowType.Conditional)
    })

    it('should leave the conditional_field key out rather than sending an empty string', () => {
      const step = buildWorkflowStep(
        baseInputs({
          workflow_type: WorkflowType.Conditional,
          conditional_field: '',
        }),
        false,
      )

      expect(step).not.toHaveProperty('conditional_field')
    })
  })

  describe('a respondent that has been chosen', () => {
    it('should carry the field through on a dynamic step', () => {
      const step = buildWorkflowStep(
        baseInputs({ workflow_type: WorkflowType.Dynamic, field: FIELD_ID }),
        false,
      )

      expect(step).toMatchObject({
        workflow_type: WorkflowType.Dynamic,
        field: FIELD_ID,
      })
    })

    it('should carry the dropdown through on a conditional step', () => {
      const step = buildWorkflowStep(
        baseInputs({
          workflow_type: WorkflowType.Conditional,
          conditional_field: DROPDOWN_ID,
        }),
        false,
      )

      expect(step).toMatchObject({
        workflow_type: WorkflowType.Conditional,
        conditional_field: DROPDOWN_ID,
      })
    })
  })

  describe('the first step', () => {
    it('should stay static when no field is chosen', () => {
      const step = buildWorkflowStep(baseInputs(), true)

      expect(step).toMatchObject({
        workflow_type: WorkflowType.Static,
        emails: [],
      })
    })

    it('should become dynamic when a field is chosen', () => {
      const step = buildWorkflowStep(baseInputs({ field: FIELD_ID }), true)

      expect(step?.workflow_type).toEqual(WorkflowType.Dynamic)
    })
  })

  describe('empty strings that mean "unset"', () => {
    it('should drop an empty approval_field', () => {
      const step = buildWorkflowStep(baseInputs({ approval_field: '' }), false)

      expect(step?.approval_field).toBeUndefined()
    })

    it('should drop an empty step_name', () => {
      const step = buildWorkflowStep(baseInputs({ step_name: '' }), false)

      expect(step?.step_name).toBeUndefined()
    })
  })
})
