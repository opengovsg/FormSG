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
  // An empty string is dropped rather than sent, since the API rejects '' and
  // it would not cast to an ObjectId.
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

  it.each<[string, Partial<EditStepInputs>, Record<string, unknown>]>([
    [
      'a chosen field on a dynamic step',
      { workflow_type: WorkflowType.Dynamic, field: FIELD_ID },
      { workflow_type: WorkflowType.Dynamic, field: FIELD_ID },
    ],
    [
      'a chosen dropdown on a conditional step',
      {
        workflow_type: WorkflowType.Conditional,
        conditional_field: DROPDOWN_ID,
      },
      {
        workflow_type: WorkflowType.Conditional,
        conditional_field: DROPDOWN_ID,
      },
    ],
  ])('should carry %s through', (_name, overrides, expected) => {
    expect(buildWorkflowStep(baseInputs(overrides), false)).toMatchObject(
      expected,
    )
  })

  // The first step is Static with no recipients until a field is chosen for it,
  // at which point it becomes Dynamic.
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

  it.each<['approval_field' | 'step_name']>([
    ['approval_field'],
    ['step_name'],
  ])('should drop an empty %s', (key) => {
    const step = buildWorkflowStep(baseInputs({ [key]: '' }), false)
    expect(step?.[key]).toBeUndefined()
  })
})
