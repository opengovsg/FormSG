import { screen } from '@testing-library/react'

import {
  DateString,
  WorkflowEventDto,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { render } from '~/test-utils'

import { WorkflowActivityLog } from './WorkflowActivityLog'

let mockEvents: WorkflowEventDto[] = []

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      key.endsWith('stepNumber')
        ? `Step ${values?.stepNumber}`
        : key.endsWith('stepNameLabel')
          ? ` (${values?.name})`
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

vi.mock('react-router-dom', () => ({
  useParams: () => ({ formId: 'form-id' }),
}))

vi.mock('./queries', () => ({
  useWorkflowEvents: () => ({ data: mockEvents }),
}))

const event = (
  type: WorkflowEventType,
  created: string,
  emails: string[],
): WorkflowEventDto => ({
  type,
  formId: 'form-id',
  submissionId: 'submission-id',
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
  afterEach(() => {
    mockEvents = []
  })

  it('lists steps and actions oldest first', () => {
    mockEvents = [
      event(WorkflowEventType.Stopped, '2026-10-08T04:00:00.000Z', []),
      event(WorkflowEventType.AssigneesAdded, '2026-10-08T02:00:00.000Z', [
        'new@agency.gov.sg',
      ]),
      event(WorkflowEventType.ReminderSent, '2026-10-08T03:00:00.000Z', [
        'lead@agency.gov.sg',
        'new@agency.gov.sg',
      ]),
    ]

    render(
      <WorkflowActivityLog submissionId="submission-id" history={history} />,
    )

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
        submissionId="submission-id"
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
})
