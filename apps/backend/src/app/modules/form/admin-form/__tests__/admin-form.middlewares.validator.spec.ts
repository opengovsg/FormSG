import { WorkflowType } from 'formsg-shared/types'

import {
  createWorkflowStepBodyValidator,
  updateWorkflowStepBodyValidator,
} from '../admin-form.middlewares'

const STEP_ID = '6a7de1810000000000000000'
const FIELD_ID = '6a7de1810000000000000001'
const EMAIL = 'someone@example.com'

/** A well-formed step body, before the case under test overrides it. */
const step = (workflowType: string, extra: Record<string, unknown> = {}) => ({
  workflow_type: workflowType,
  edit: [FIELD_ID],
  ...extra,
})

describe('workflow step body validators', () => {
  // FRM-2489 moved completeness out of Joi and into the service layer, which
  // knows the form's status. Joi now checks format and shape only.
  it.each<[string, unknown]>([
    ['a dynamic step with no field chosen', step(WorkflowType.Dynamic)],
    ['a conditional step with no dropdown', step(WorkflowType.Conditional)],
    [
      'a static step with no recipients',
      step(WorkflowType.Static, { emails: [] }),
    ],
    [
      'a step with no fields to fill in',
      step(WorkflowType.Static, { emails: [EMAIL], edit: [] }),
    ],
  ])('should accept %s, on create and update', (_name, body) => {
    expect(createWorkflowStepBodyValidator.validate(body).error).toBeUndefined()
    expect(
      updateWorkflowStepBodyValidator.validate({
        _id: STEP_ID,
        ...(body as Record<string, unknown>),
      }).error,
    ).toBeUndefined()
  })

  it.each<[string, unknown]>([
    ['an unrecognised workflow type', step('nonsense')],
    [
      'a malformed recipient address',
      step(WorkflowType.Static, { emails: ['not-an-email'] }),
    ],
    [
      'a missing edit key',
      { workflow_type: WorkflowType.Static, emails: [EMAIL] },
    ],
    [
      'conditional_field on a non-conditional step',
      step(WorkflowType.Static, { emails: [], conditional_field: FIELD_ID }),
    ],
    // An empty string is not "unset": it would fail to cast to an ObjectId
    // further down. Clients must omit the key instead.
    [
      'an empty string for a field id',
      step(WorkflowType.Dynamic, { field: '' }),
    ],
  ])('should reject %s', (_name, body) => {
    expect(createWorkflowStepBodyValidator.validate(body).error).toBeDefined()
  })

  it('should reject a missing _id on update', () => {
    const { error } = updateWorkflowStepBodyValidator.validate(
      step(WorkflowType.Static, { emails: [] }),
    )
    expect(error).toBeDefined()
  })

  // Only the update validator constrains `edit` to ObjectId format; create
  // accepts any string. Pre-existing on develop, asserted here so a future
  // tidy-up of these two schemas notices the asymmetry rather than assuming it.
  it('should reject a non-ObjectId entry in edit on update', () => {
    const { error } = updateWorkflowStepBodyValidator.validate({
      _id: STEP_ID,
      ...step(WorkflowType.Static, { emails: [], edit: ['not-an-object-id'] }),
    })
    expect(error).toBeDefined()
  })
})
