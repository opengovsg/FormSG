import {
  DateString,
  WorkflowEventDto,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import {
  getStepRecipients,
  getStopNotifiedEmails,
} from './getStopNotifiedEmails'

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
  formId: 'form',
  submissionId: 'submission',
  actorEmail: 'admin@agency.gov.sg',
  stepNumber,
  emails,
  created: '2026-10-08T00:00:00.000Z' as DateString,
})

const base = {
  history,
  responses: [{ _id: 'email-field', answer: 'person@agency.gov.sg' }],
  otherEmails: [],
  stepIdsToNotify: [],
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

describe('getStopNotifiedEmails', () => {
  it('notifies no step unless it is selected', () => {
    expect(getStopNotifiedEmails(base)).toEqual([])
  })

  it('notifies the pending step, from its step history, when selected', () => {
    expect(
      getStopNotifiedEmails({ ...base, stepIdsToNotify: ['step-2'] }),
    ).toEqual(['lead@agency.gov.sg'])
  })

  it('notifies people added to the pending step', () => {
    expect(
      getStopNotifiedEmails({
        ...base,
        events: [addedEvent(2, ['added@agency.gov.sg'])],
        stepIdsToNotify: ['step-2'],
      }),
    ).toEqual(['lead@agency.gov.sg', 'added@agency.gov.sg'])
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
