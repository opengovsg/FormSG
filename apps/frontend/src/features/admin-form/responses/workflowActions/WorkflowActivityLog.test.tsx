import { screen } from '@testing-library/react'

import {
  DateString,
  WorkflowEventDto,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { render } from '~/test-utils'

import { WorkflowActivityLog } from './WorkflowActivityLog'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key.endsWith('stepNumber')
        ? `Step ${values?.stepNumber}`
        : key.endsWith('stepNameLabel')
          ? ` (${values?.name})`
          : key.endsWith('remarks')
            ? `remarks: ${values?.remarks}`
            : key.split('.').pop(),
  }),
  Trans: ({
    i18nKey,
    values,
  }: {
    i18nKey: string
    values: Record<string, string>
  }) => (
    <span>
      {i18nKey.split('.').pop()}: {Object.values(values).join(' | ')}
    </span>
  ),
}))

const event = (
  type: WorkflowEventType,
  created: string,
  emails: string[],
): WorkflowEventDto => ({
  type,
  actorEmail: 'admin@agency.gov.sg',
  stepNumber: 2,
  emails,
  created: created as DateString,
})

const history = {
  submittedSteps: [
    {
      isApproval: false as const,
      submittedAt: '2026-10-08T01:00:00.000Z',
      nextStepRecipientEmails: ['lead@agency.gov.sg'],
    },
  ],
  workflow: [
    { _id: 'step-1', step_name: 'Applicant' },
    { _id: 'step-2', step_name: 'Team lead' },
    { _id: 'step-3' },
  ],
}

describe('WorkflowActivityLog', () => {
  it('lists steps and actions oldest first', () => {
    const workflowEvents = [
      event(WorkflowEventType.Stopped, '2026-10-08T04:00:00.000Z', []),
      event(WorkflowEventType.AssigneesAdded, '2026-10-08T02:00:00.000Z', [
        'new@agency.gov.sg',
      ]),
      event(WorkflowEventType.ReminderSent, '2026-10-08T03:00:00.000Z', [
        'lead@agency.gov.sg',
        'new@agency.gov.sg',
      ]),
    ]

    render(<WorkflowActivityLog history={{ ...history, workflowEvents }} />)

    const entries = screen
      .getAllByText(/^(step|assignee|reminder|stopped)/)
      .map((element) => element.textContent)
    expect(entries).toEqual([
      'stepCompletedSentTo: Step 1 |  (Applicant) | lead@agency.gov.sg',
      'assigneeAdded: new@agency.gov.sg | Step 2 |  (Team lead) | admin@agency.gov.sg',
      'reminderSent: lead@agency.gov.sg and new@agency.gov.sg | admin@agency.gov.sg',
      'stopped: admin@agency.gov.sg',
    ])
  })

  it('shows an approval outcome', () => {
    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [
            history.submittedSteps[0],
            {
              isApproval: true,
              status: WorkflowStatus.REJECTED,
              submittedAt: '2026-10-08T02:00:00.000Z',
            },
          ],
        }}
      />,
    )

    expect(
      screen.getByText(/^stepNotApproved: Step 2 \| +\(Team lead\)/),
    ).toBeInTheDocument()
  })

  it('keeps the steps a send back undid, then the send back, in time order', () => {
    const sentBack: WorkflowEventDto = {
      type: WorkflowEventType.SentBack,
      actorEmail: 'admin@agency.gov.sg',
      stepNumber: 2,
      fromStepNumber: 3,
      emails: ['lead@agency.gov.sg'],
      remarks: 'Fix the <b>dates</b>',
      undoneSteps: [
        {
          stepNumber: 2,
          submittedAt: '2026-10-08T02:00:00.000Z',
          isApproval: true,
          status: WorkflowStatus.APPROVED,
          nextStepRecipientEmails: ['hr@agency.gov.sg'],
        },
      ],
      created: '2026-10-08T03:00:00.000Z' as DateString,
    }

    render(
      <WorkflowActivityLog
        history={{
          ...history,
          submittedSteps: [
            history.submittedSteps[0],
            {
              isApproval: true,
              status: WorkflowStatus.APPROVED,
              submittedAt: '2026-10-08T04:00:00.000Z',
              nextStepRecipientEmails: ['hr@agency.gov.sg'],
            },
          ],
          workflowEvents: [sentBack],
        }}
      />,
    )

    const entries = screen
      .getAllByText(/^(step|sentBack|remarks)/)
      .map((element) => element.textContent)
    expect(entries).toEqual([
      'stepCompletedSentTo: Step 1 |  (Applicant) | lead@agency.gov.sg',
      'stepApprovedSentTo: Step 2 |  (Team lead) | hr@agency.gov.sg',
      'sentBackSentTo: admin@agency.gov.sg | 3 | Step 2 |  (Team lead) | lead@agency.gov.sg',
      'remarks: Fix the <b>dates</b>',
      'stepApprovedSentTo: Step 2 |  (Team lead) | hr@agency.gov.sg',
    ])
  })
})
