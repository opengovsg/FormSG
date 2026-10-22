import { getStepRecipients } from './getStopNotifiedEmails'

const history = {
  submittedSteps: [
    {
      isApproval: false as const,
      submittedAt: '2026-10-07T00:00:00.000Z',
      nextStepRecipientEmails: ['lead@agency.gov.sg'],
    },
  ],
  workflow: [
    { _id: 'step-1', step_name: 'Person' },
    { _id: 'step-2', step_name: 'Team lead' },
    { _id: 'step-3', step_name: 'Workplace team' },
  ],
}

const reassignedHistory = {
  ...history,
  submittedSteps: [
    {
      ...history.submittedSteps[0],
      nextStepRecipientEmails: ['lead@agency.gov.sg', 'Added@agency.gov.sg'],
    },
  ],
}

describe('getStepRecipients', () => {
  it('reads who the step was sent to from the previous step', () => {
    expect(
      getStepRecipients({
        submittedSteps: history.submittedSteps,
        stepNumber: 2,
      }),
    ).toEqual(['lead@agency.gov.sg'])
  })

  it('adds people added to the step through Reassign', () => {
    expect(
      getStepRecipients({
        submittedSteps: reassignedHistory.submittedSteps,
        stepNumber: 2,
      }),
    ).toEqual(['lead@agency.gov.sg', 'added@agency.gov.sg'])
  })

  it('has no stored recipients for step 1', () => {
    expect(
      getStepRecipients({
        submittedSteps: history.submittedSteps,
        stepNumber: 1,
      }),
    ).toEqual([])
  })
})
