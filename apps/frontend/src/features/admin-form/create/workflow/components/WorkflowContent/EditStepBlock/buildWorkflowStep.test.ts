import { WorkflowType } from 'formsg-shared/types'

import { EditStepInputs } from '../../../types'
import { buildWorkflowStep } from './EditStepBlock'

const FIELD_ID = '6a7de1810000000000000001'

const baseInputs = (overrides: Partial<EditStepInputs> = {}) =>
  ({
    _id: 'step-1',
    workflow_type: WorkflowType.Static,
    edit: [FIELD_ID],
    emails: [],
    ...overrides,
  }) as EditStepInputs

describe('buildWorkflowStep', () => {
  it.each<[string, Partial<EditStepInputs>, string]>([
    ['dynamic, no field', { workflow_type: WorkflowType.Dynamic }, 'field'],
    [
      'dynamic, empty field',
      { workflow_type: WorkflowType.Dynamic, field: '' },
      'field',
    ],
    [
      'conditional, no dropdown',
      { workflow_type: WorkflowType.Conditional },
      'conditional_field',
    ],
    [
      'conditional, empty dropdown',
      { workflow_type: WorkflowType.Conditional, conditional_field: '' },
      'conditional_field',
    ],
  ])('should build %s, omitting the key', (_name, overrides, omittedKey) => {
    const step = buildWorkflowStep(baseInputs(overrides), false)

    expect(step?.workflow_type).toEqual(overrides.workflow_type)
    expect(step).not.toHaveProperty(omittedKey)
  })

  // Step 1 is always static ("anyone with the link"). A legacy dynamic step 1
  // may carry a `field` pointing at a deleted email field, which the backend
  // rejects — saving must rewrite it to static and drop the field.
  it.each<[string, Partial<EditStepInputs>]>([
    ['no field is set', {}],
    [
      'a legacy dynamic field is set',
      { workflow_type: WorkflowType.Dynamic, field: FIELD_ID },
    ],
  ])('should build the first step as static when %s', (_name, overrides) => {
    const step = buildWorkflowStep(baseInputs(overrides), true)

    expect(step?.workflow_type).toEqual(WorkflowType.Static)
    expect(step).not.toHaveProperty('field')
  })

  it('should save a step with no respondent type as static with no emails', () => {
    const step = buildWorkflowStep(
      baseInputs({ workflow_type: undefined }),
      false,
    )

    expect(step?.workflow_type).toEqual(WorkflowType.Static)
    expect(step).toHaveProperty('emails', [])
  })
})
