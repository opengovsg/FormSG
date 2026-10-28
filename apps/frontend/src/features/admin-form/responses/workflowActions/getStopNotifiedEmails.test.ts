import {
  DateString,
  WorkflowEventDto,
  WorkflowEventType,
} from 'formsg-shared/types'

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

const addedEvent = (
  stepNumber: number,
  emails: string[],
): WorkflowEventDto => ({
  type: WorkflowEventType.AssigneesAdded,
  actorEmail: 'admin@agency.gov.sg',
  stepNumber,
  emails,
  created: '2026-10-08T00:00:00.000Z' as DateString,
})

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
        submittedSteps: history.submittedSteps,
        events: [
          addedEvent(2, ['Added@agency.gov.sg']),
          addedEvent(3, ['later@agency.gov.sg']),
        ],
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
