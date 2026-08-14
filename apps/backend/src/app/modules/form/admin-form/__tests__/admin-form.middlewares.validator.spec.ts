import { WorkflowType } from 'formsg-shared/types'

import {
  createWorkflowStepBodyValidator,
  updateWorkflowStepBodyValidator,
} from '../admin-form.middlewares'

const STEP_ID = '6a7de1810000000000000000'
const FIELD_ID = '6a7de1810000000000000001'

describe('workflow step body validators', () => {
  // FRM-2489 moved completeness out of Joi and into the service layer, which
  // knows the form's status. Joi now checks format and shape only.
  describe('incompleteness is allowed through', () => {
    const incompleteCases: Array<{ name: string; body: unknown }> = [
      {
        name: 'a dynamic step with no field chosen',
        body: {
          workflow_type: WorkflowType.Dynamic,
          edit: [FIELD_ID],
        },
      },
      {
        name: 'a conditional step with no dropdown chosen',
        body: {
          workflow_type: WorkflowType.Conditional,
          edit: [FIELD_ID],
        },
      },
      {
        name: 'a static step with no recipients',
        body: {
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [FIELD_ID],
        },
      },
      {
        name: 'a step with no fields to fill in',
        body: {
          workflow_type: WorkflowType.Static,
          emails: ['someone@example.com'],
          edit: [],
        },
      },
    ]

    it.each(incompleteCases)('should accept $name on create', ({ body }) => {
      const { error } = createWorkflowStepBodyValidator.validate(body)
      expect(error).toBeUndefined()
    })

    it.each(incompleteCases)('should accept $name on update', ({ body }) => {
      const { error } = updateWorkflowStepBodyValidator.validate({
        _id: STEP_ID,
        ...(body as Record<string, unknown>),
      })
      expect(error).toBeUndefined()
    })
  })

  describe('format and shape are still enforced', () => {
    const rejectCases: Array<{ name: string; body: unknown }> = [
      {
        name: 'an unrecognised workflow type',
        body: { workflow_type: 'nonsense', edit: [FIELD_ID] },
      },
      {
        name: 'a malformed recipient address',
        body: {
          workflow_type: WorkflowType.Static,
          emails: ['not-an-email'],
          edit: [FIELD_ID],
        },
      },
      {
        name: 'a missing edit key',
        body: {
          workflow_type: WorkflowType.Static,
          emails: ['someone@example.com'],
        },
      },
      {
        name: 'conditional_field on a non-conditional step',
        body: {
          workflow_type: WorkflowType.Static,
          emails: [],
          edit: [FIELD_ID],
          conditional_field: FIELD_ID,
        },
      },
      {
        // An empty string is not "unset": it would fail to cast to an ObjectId
        // further down. Clients must omit the key instead.
        name: 'an empty string for a field id',
        body: {
          workflow_type: WorkflowType.Dynamic,
          edit: [FIELD_ID],
          field: '',
        },
      },
    ]

    it.each(rejectCases)('should reject $name on create', ({ body }) => {
      const { error } = createWorkflowStepBodyValidator.validate(body)
      expect(error).toBeDefined()
    })

    it('should reject a missing _id on update', () => {
      const { error } = updateWorkflowStepBodyValidator.validate({
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: [FIELD_ID],
      })
      expect(error).toBeDefined()
    })

    it('should reject a non-ObjectId entry in edit on update', () => {
      const { error } = updateWorkflowStepBodyValidator.validate({
        _id: STEP_ID,
        workflow_type: WorkflowType.Static,
        emails: [],
        edit: ['not-an-object-id'],
      })
      expect(error).toBeDefined()
    })
  })
})
