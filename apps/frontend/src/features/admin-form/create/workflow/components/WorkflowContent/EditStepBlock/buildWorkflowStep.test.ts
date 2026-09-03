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
  // FRM-2489: an unchosen or emptied field/conditional_field is omitted, not sent as ''.
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

  it.each<[string, Partial<EditStepInputs>, WorkflowType]>([
    ['stay static when no field is chosen', {}, WorkflowType.Static],
    [
      'become dynamic when a field is chosen',
      { field: FIELD_ID },
      WorkflowType.Dynamic,
    ],
  ])('should %s', (_name, overrides, expected) => {
    expect(
      buildWorkflowStep(baseInputs(overrides), true)?.workflow_type,
    ).toEqual(expected)
  })
})
