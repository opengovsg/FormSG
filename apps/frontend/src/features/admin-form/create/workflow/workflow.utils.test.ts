import { BasicField, FormFieldDto } from 'formsg-shared/types/field'
import { FormWorkflowStep, WorkflowType } from 'formsg-shared/types/form'

import { isWorkflowFeedbackEligible } from './workflow.utils'

// Covers only what this wrapper can get wrong on its own: the threshold and the positional index.

// The first step's respondent is implicit, so these fixtures leave it empty.
const firstStep = (edit: string[] = ['field1']): FormWorkflowStep => ({
  workflow_type: WorkflowType.Static,
  edit,
  emails: [],
})

const staticStep = (
  edit: string[] = ['field1'],
  emails: string[] = ['user@example.com'],
): FormWorkflowStep => ({
  workflow_type: WorkflowType.Static,
  edit,
  emails,
})

const makeDropdown = (
  fieldId: string,
  fieldOptions: string[],
  optionsToRecipientsMap?: Record<string, string[]>,
) =>
  ({
    _id: fieldId,
    fieldType: BasicField.Dropdown,
    fieldOptions,
    optionsToRecipientsMap,
  }) as unknown as FormFieldDto

const formFields = [
  { _id: 'field1', fieldType: BasicField.YesNo } as FormFieldDto,
  makeDropdown('unmappedFieldId', ['a', 'b'], { a: ['user@example.com'] }),
]

describe('isWorkflowFeedbackEligible', () => {
  it.each<[string, FormWorkflowStep[], boolean]>([
    ['an empty workflow', [], false],
    ['the first step alone', [firstStep()], false],
    ['one complete step besides the first', [firstStep(), staticStep()], true],
    [
      'only one complete step in total',
      [firstStep([]), staticStep(['field1'], [])],
      false,
    ],
  ])('should return %s -> %s', (_name, workflow, expected) => {
    expect(isWorkflowFeedbackEligible(workflow, formFields)).toBe(expected)
  })

  // The empty-emails exemption is positional. Only index 0 gets it, otherwise
  // any later Static step left unconfigured would count towards the threshold.
  it('should not exempt a later static step with no emails', () => {
    expect(
      isWorkflowFeedbackEligible(
        [firstStep(), staticStep(['field1'], []), staticStep(['field1'], [])],
        formFields,
      ),
    ).toBe(false)
  })

  // Behaviour change, intended: the shared predicate requires every dropdown
  // option to have a recipient, where the old feedback-only helper stopped at
  // "a dropdown was chosen".
  it('should return false for a conditional step with an unmapped option', () => {
    expect(
      isWorkflowFeedbackEligible(
        [
          firstStep(),
          {
            workflow_type: WorkflowType.Conditional,
            edit: ['field1'],
            conditional_field: 'unmappedFieldId',
          },
        ],
        formFields,
      ),
    ).toBe(false)
  })
})
