import { ObjectId } from 'bson'

import {
  getIncompleteStepNumbers,
  isStepComplete,
  mustWorkflowBeComplete,
} from '../workflow-step-completion'

import {
  BasicField,
  FormFieldDto,
  FormStatus,
  FormWorkflowStep,
  WorkflowType,
} from '../../types'

describe('mustWorkflowBeComplete', () => {
  // Only a live form needs a runnable workflow. Private is the whole point of
  // the ticket; Archived cannot be edited; an unknown status defers to the
  // server. The redesign flag is deliberately not an input, so that rolling it
  // back cannot start rejecting mutations on forms that saved legally.
  it.each<[FormStatus | undefined, boolean]>([
    [FormStatus.Public, true],
    [FormStatus.Private, false],
    [FormStatus.Archived, false],
    [undefined, false],
  ])('status=%s -> mustBeComplete=%s', (formStatus, expected) => {
    expect(mustWorkflowBeComplete({ formStatus })).toBe(expected)
  })
})

describe('isStepComplete', () => {
  const FIELD_ID = 'field-1'
  const OTHER_FIELD_ID = 'field-2'
  const DROPDOWN_ID = 'dropdown-1'
  const EMAIL = 'someone@example.com'

  const makeField = (fieldId: string, fieldType: BasicField) =>
    ({ _id: fieldId, fieldType }) as FormFieldDto

  const makeDropdown = (optionsToRecipientsMap?: Record<string, string[]>) =>
    ({
      _id: DROPDOWN_ID,
      fieldType: BasicField.Dropdown,
      fieldOptions: ['a', 'b'],
      optionsToRecipientsMap,
    }) as unknown as FormFieldDto

  const staticStep = (overrides: Partial<FormWorkflowStep> = {}) =>
    ({
      workflow_type: WorkflowType.Static,
      edit: [FIELD_ID],
      emails: [EMAIL],
      ...overrides,
    }) as FormWorkflowStep

  const formFields = [makeField(FIELD_ID, BasicField.YesNo)]
  const withDropdown = (map?: Record<string, string[]>) => [
    ...formFields,
    makeDropdown(map),
  ]

  // A step needs a person, not fields: a respondent who only reads the
  // submission and passes it on is legitimate, and live forms do this.
  it.each<[string, FormWorkflowStep, number, boolean]>([
    ['no fields but a recipient', staticStep({ edit: [] }), 1, true],
    ['step 0 with no fields', staticStep({ edit: [], emails: [] }), 0, true],
    ['step 0 with no recipient', staticStep({ emails: [] }), 0, true],
    [
      'neither fields nor recipient',
      staticStep({ edit: [], emails: [] }),
      1,
      false,
    ],
    ['no recipient', staticStep({ emails: [] }), 1, false],
    ['a recipient', staticStep(), 1, true],
  ])('static: %s -> %s', (_name, step, stepNumber, expected) => {
    expect(isStepComplete(step, formFields, stepNumber)).toBe(expected)
  })

  it.each<[string, string | undefined, boolean]>([
    ['no field chosen', undefined, false],
    ['a field chosen', OTHER_FIELD_ID, true],
  ])('dynamic: %s -> %s', (_name, field, expected) => {
    const step = {
      workflow_type: WorkflowType.Dynamic,
      edit: [FIELD_ID],
      field,
    } as unknown as FormWorkflowStep
    expect(isStepComplete(step, formFields, 1)).toBe(expected)
  })

  it.each<[string, string | undefined, FormFieldDto[], boolean]>([
    ['no dropdown chosen', undefined, formFields, false],
    ['dropdown no longer exists', DROPDOWN_ID, formFields, false],
    [
      'chosen field is not a dropdown',
      DROPDOWN_ID,
      [...formFields, makeField(DROPDOWN_ID, BasicField.YesNo)],
      false,
    ],
    [
      'an option has no recipients',
      DROPDOWN_ID,
      withDropdown({ a: [EMAIL], b: [] }),
      false,
    ],
    [
      'an option missing from the map',
      DROPDOWN_ID,
      withDropdown({ a: [EMAIL] }),
      false,
    ],
    ['no map at all', DROPDOWN_ID, withDropdown(), false],
    [
      'every option mapped',
      DROPDOWN_ID,
      withDropdown({ a: [EMAIL], b: [EMAIL] }),
      true,
    ],
  ])('conditional: %s -> %s', (_name, conditionalField, fields, expected) => {
    const step = {
      workflow_type: WorkflowType.Conditional,
      edit: [FIELD_ID],
      conditional_field: conditionalField,
    } as unknown as FormWorkflowStep
    expect(isStepComplete(step, fields, 1)).toBe(expected)
  })

  // An approval field the assigned person cannot see stops the workflow dead,
  // so this applies to step 0 too, unlike the respondent rules.
  it.each<[string, Partial<FormWorkflowStep>, number, boolean]>([
    [
      'unreachable approval field',
      { approval_field: OTHER_FIELD_ID },
      1,
      false,
    ],
    ['reachable approval field', { approval_field: FIELD_ID }, 1, true],
    ['no approval field', {}, 1, true],
    [
      'unreachable on step 0',
      { approval_field: OTHER_FIELD_ID, emails: [] },
      0,
      false,
    ],
  ])('approval: %s -> %s', (_name, overrides, stepNumber, expected) => {
    expect(isStepComplete(staticStep(overrides), formFields, stepNumber)).toBe(
      expected,
    )
  })

  // The backend passes Mongoose ObjectIds, not strings. `===` and `includes`
  // compare object identity, so every id comparison must go through String().
  describe('object ids', () => {
    const EDIT_HEX = '6a7de1810000000000000001'
    const DROPDOWN_HEX = '6a7de1810000000000000002'

    it('should match an approval field given as an ObjectId', () => {
      const step = {
        workflow_type: WorkflowType.Static,
        edit: [new ObjectId(EDIT_HEX)],
        emails: [EMAIL],
        approval_field: new ObjectId(EDIT_HEX),
      } as unknown as FormWorkflowStep
      expect(isStepComplete(step, [], 1)).toBe(true)
    })

    it('should match a conditional field given as an ObjectId', () => {
      const step = {
        workflow_type: WorkflowType.Conditional,
        edit: [new ObjectId(EDIT_HEX)],
        conditional_field: new ObjectId(DROPDOWN_HEX),
      } as unknown as FormWorkflowStep
      const fields = [
        {
          _id: new ObjectId(DROPDOWN_HEX),
          fieldType: BasicField.Dropdown,
          fieldOptions: ['a'],
          optionsToRecipientsMap: { a: [EMAIL] },
        },
      ] as unknown as FormFieldDto[]
      expect(isStepComplete(step, fields, 1)).toBe(true)
    })
  })

  describe('getIncompleteStepNumbers', () => {
    it('should return the indices of incomplete steps only', () => {
      const workflow = [
        staticStep({ emails: [] }), // step 0, exempt
        staticStep(), // complete
        staticStep({ emails: [] }), // incomplete, no recipient
        staticStep({ edit: [] }), // complete, no fields is allowed
      ]
      expect(getIncompleteStepNumbers(workflow, formFields)).toEqual([2])
    })

    it('should return an empty array when every step is complete', () => {
      expect(
        getIncompleteStepNumbers([staticStep(), staticStep()], formFields),
      ).toEqual([])
    })
  })
})
