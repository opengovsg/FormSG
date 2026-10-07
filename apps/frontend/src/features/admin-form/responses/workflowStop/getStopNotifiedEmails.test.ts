import { WorkflowStatus } from 'formsg-shared/types'

import {
  getStepAssignees,
  getStopNotifiedEmails,
} from './getStopNotifiedEmails'

// Step 1 submitted and sent to the team lead; waiting on step 2.
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

const base = {
  history,
  assignees: [],
  responses: [{ _id: 'email-field', answer: 'person@agency.gov.sg' }],
  otherEmails: [],
  stepIdsToNotify: [],
}

describe('getStepAssignees', () => {
  it('combines who the step was sent to with preview assignees', () => {
    expect(
      getStepAssignees({
        submittedSteps: history.submittedSteps,
        assignees: [
          {
            addedAt: '2026-10-07T01:00:00.000Z',
            emails: ['Added@agency.gov.sg'],
            stepNumber: 2,
          },
        ],
        stepNumber: 2,
      }),
    ).toEqual(['lead@agency.gov.sg', 'added@agency.gov.sg'])
  })

  it('has no stored recipients for step 1', () => {
    expect(
      getStepAssignees({
        submittedSteps: history.submittedSteps,
        assignees: [],
        stepNumber: 1,
      }),
    ).toEqual([])
  })
})

describe('getStopNotifiedEmails', () => {
  it('notifies no step unless it is selected', () => {
    expect(getStopNotifiedEmails(base)).toEqual([])
  })

  it('notifies the pending step, from its step history, when selected', () => {
    expect(
      getStopNotifiedEmails({ ...base, stepIdsToNotify: ['step-2'] }),
    ).toEqual(['lead@agency.gov.sg'])
  })

  it('skips selected steps after the pending step', () => {
    expect(
      getStopNotifiedEmails({ ...base, stepIdsToNotify: ['step-3'] }),
    ).toEqual([])
  })

  it('combines chosen addresses and the email field answer, deduplicated', () => {
    expect(
      getStopNotifiedEmails({
        ...base,
        otherEmails: ['records@agency.gov.sg', 'Person@agency.gov.sg'],
        stepOneEmailFieldId: 'email-field',
      }),
    ).toEqual(['records@agency.gov.sg', 'person@agency.gov.sg'])
  })

  it('reads approval steps the same way', () => {
    expect(
      getStopNotifiedEmails({
        ...base,
        history: {
          ...history,
          submittedSteps: [
            {
              isApproval: true as const,
              status: WorkflowStatus.APPROVED,
              submittedAt: '2026-10-07T00:00:00.000Z',
              nextStepRecipientEmails: ['lead@agency.gov.sg'],
            },
          ],
        },
        stepIdsToNotify: ['step-2'],
      }),
    ).toEqual(['lead@agency.gov.sg'])
  })
})
