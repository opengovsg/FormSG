import { getCompletionEmailRecipients } from './getCompletionEmailRecipients'

const EMPTY = {
  emails: [],
  stepOneEmailNotificationFieldId: '',
  stepsToNotify: [],
  workflowSteps: [],
  emailFormFields: [],
}

// Step 2 is the only named one, so the tests can tell naming from numbering.
const WORKFLOW_STEPS = [
  { _id: 'step1' },
  { _id: 'step2', step_name: 'Approver' },
  { _id: 'step3' },
]

const EMAIL_FIELDS = [{ _id: 'fieldA', questionNumber: 2, title: 'Your email' }]

describe('getCompletionEmailRecipients', () => {
  it('should report empty when nothing is configured', () => {
    expect(getCompletionEmailRecipients(EMPTY)).toEqual({
      otherParties: [],
      stepOneField: null,
      notifiedSteps: [],
      isEmpty: true,
    })
  })

  it('should not report empty when any one group is configured', () => {
    const configured = [
      { ...EMPTY, emails: ['a@example.gov.sg'] },
      {
        ...EMPTY,
        stepOneEmailNotificationFieldId: 'fieldA',
        emailFormFields: EMAIL_FIELDS,
      },
      { ...EMPTY, stepsToNotify: ['step2'], workflowSteps: WORKFLOW_STEPS },
    ]

    configured.forEach((input) =>
      expect(getCompletionEmailRecipients(input).isEmpty).toBe(false),
    )
  })

  it('should report empty when the only configured values no longer resolve', () => {
    // A deleted field and a deleted step leave nothing to show, so the card
    // must fall back to its empty state rather than render blank groups.
    const result = getCompletionEmailRecipients({
      ...EMPTY,
      stepOneEmailNotificationFieldId: 'deletedField',
      stepsToNotify: ['deletedStep'],
      workflowSteps: WORKFLOW_STEPS,
      emailFormFields: EMAIL_FIELDS,
    })

    expect(result).toEqual({
      otherParties: [],
      stepOneField: null,
      notifiedSteps: [],
      isEmpty: true,
    })
  })

  it('should keep other parties in stored order and drop empty entries', () => {
    expect(
      getCompletionEmailRecipients({
        ...EMPTY,
        emails: ['zoe@example.gov.sg', '', 'amir@example.gov.sg'],
      }).otherParties,
    ).toEqual(['zoe@example.gov.sg', 'amir@example.gov.sg'])
  })

  it('should drop duplicate other parties, keeping the first occurrence', () => {
    expect(
      getCompletionEmailRecipients({
        ...EMPTY,
        emails: [
          'zoe@example.gov.sg',
          'amir@example.gov.sg',
          'zoe@example.gov.sg',
        ],
      }).otherParties,
    ).toEqual(['zoe@example.gov.sg', 'amir@example.gov.sg'])
  })

  it('should resolve the step 1 field to its question number and title', () => {
    expect(
      getCompletionEmailRecipients({
        ...EMPTY,
        stepOneEmailNotificationFieldId: 'fieldA',
        emailFormFields: EMAIL_FIELDS,
      }).stepOneField,
    ).toEqual({ questionNumber: 2, title: 'Your email' })
  })

  it('should read notified steps in workflow order, carrying any step name', () => {
    expect(
      getCompletionEmailRecipients({
        ...EMPTY,
        // Deliberately out of order, and including a since-deleted step.
        stepsToNotify: ['step3', 'deletedStep', 'step2'],
        workflowSteps: WORKFLOW_STEPS,
      }).notifiedSteps,
    ).toEqual([
      { stepNumber: 2, stepName: 'Approver' },
      { stepNumber: 3, stepName: undefined },
    ])
  })
})
