import { BasicField, FormFieldDto } from 'formsg-shared/types/field'
import { FormWorkflowStep, WorkflowType } from 'formsg-shared/types/form'

import { isWorkflowFeedbackEligible } from './workflow.utils'

// The first step's respondent is always "anyone who has access to your form",
// stored as a Static step with no emails, so these fixtures deliberately leave
// `emails` empty for it.
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

const makeField = (fieldId: string, fieldType: BasicField) =>
  ({ _id: fieldId, fieldType }) as FormFieldDto

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
  makeField('field1', BasicField.YesNo),
  makeDropdown('condFieldId', ['a'], { a: ['user@example.com'] }),
  makeDropdown('unmappedFieldId', ['a', 'b'], { a: ['user@example.com'] }),
]

describe('isWorkflowFeedbackEligible', () => {
  it('should return true for a first step plus a completed static step', () => {
    expect(
      isWorkflowFeedbackEligible([firstStep(), staticStep()], formFields),
    ).toBe(true)
  })

  it('should return true for a first step plus a completed dynamic step', () => {
    expect(
      isWorkflowFeedbackEligible(
        [
          firstStep(),
          {
            workflow_type: WorkflowType.Dynamic,
            edit: ['field1'],
            field: 'emailFieldId',
          },
        ],
        formFields,
      ),
    ).toBe(true)
  })

  it('should return true for a first step plus a fully mapped conditional step', () => {
    expect(
      isWorkflowFeedbackEligible(
        [
          firstStep(),
          {
            workflow_type: WorkflowType.Conditional,
            edit: ['field1'],
            conditional_field: 'condFieldId',
          },
        ],
        formFields,
      ),
    ).toBe(true)
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

  it('should return false for the first step alone', () => {
    expect(isWorkflowFeedbackEligible([firstStep()], formFields)).toBe(false)
  })

  it('should return false for an empty workflow', () => {
    expect(isWorkflowFeedbackEligible([], formFields)).toBe(false)
  })

  it('should return false when the second step has no fields', () => {
    expect(
      isWorkflowFeedbackEligible([firstStep(), staticStep([])], formFields),
    ).toBe(false)
  })

  it('should return false when the second step has no respondent', () => {
    expect(
      isWorkflowFeedbackEligible(
        [firstStep(), staticStep(['field1'], [])],
        formFields,
      ),
    ).toBe(false)
  })

  it('should return false when the first step has no fields and only one later step is complete', () => {
    expect(
      isWorkflowFeedbackEligible([firstStep([]), staticStep()], formFields),
    ).toBe(false)
  })

  it('should return true when the first step has no fields but two later steps are complete', () => {
    expect(
      isWorkflowFeedbackEligible(
        [firstStep([]), staticStep(), staticStep()],
        formFields,
      ),
    ).toBe(true)
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
})
