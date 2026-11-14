import { screen } from '@testing-library/react'

import {
  DateString,
  SubmissionMrfMetadata,
  WorkflowEventType,
  WorkflowStatus,
} from 'formsg-shared/types'

import { render } from '~/test-utils'

import { getCurrentStepRecipients } from './getCurrentStepRecipients'
import { WorkflowHistory } from './getStopNotifiedEmails'
import { WorkflowCurrentState } from './WorkflowCurrentState'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values: Record<string, unknown> = {}) => {
      const copy: Record<string, string> = {
        currentStep: 'Current step: Step {stepNumber}{stepName}',
        pending: 'Pending',
        assignees: 'Current assignees',
        completed: 'Completed',
        rejected: 'Rejected',
        voided: 'Voided',
      }
      return (copy[key.split('.').pop()!] ?? key).replace(
        /\{(\w+)\}/g,
        (_, name: string) => String(values[name] ?? ''),
      )
    },
  }),
  Trans: () => null,
}))
const history: WorkflowHistory = {
  submittedSteps: [
    {
      isApproval: false,
      submittedAt: '2026-11-14T01:00:00Z',
      nextStepRecipientEmails: ['manager@agency.gov.sg'],
    },
    {
      isApproval: false,
      submittedAt: '2026-11-14T02:00:00Z',
      nextStepRecipientEmails: ['finance@agency.gov.sg'],
    },
  ],
  workflow: [
    { _id: '1', step_name: 'Applicant' },
    { _id: '2', step_name: 'Manager' },
    { _id: '3', step_name: 'Finance' },
  ],
}
const mrf: NonNullable<SubmissionMrfMetadata> = {
  workflowCurrentStepNumber: 2,
  workflowNumTotalSteps: 3,
  workflowStatus: WorkflowStatus.PENDING,
  lastSubmittedAt: undefined,
  hasNextStepRecipientEmails: true,
}
const event = (
  type:
    | WorkflowEventType.FixStep
    | WorkflowEventType.SentBack
    | WorkflowEventType.AssigneesAdded,
  stepNumber: number,
  emails: string[],
) => ({
  type,
  stepNumber,
  emails,
  actorEmail: 'admin@agency.gov.sg',
  created: '2026-11-14T03:00:00Z' as DateString,
})

describe('WorkflowCurrentState', () => {
  it('shows pending current step and recipients with actions', () => {
    render(
      <WorkflowCurrentState
        mrf={mrf}
        history={history}
        actions={<button>Remind</button>}
      />,
    )
    expect(
      screen.getByText('Current step: Step 3 (Finance)'),
    ).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('finance@agency.gov.sg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remind' })).toBeInTheDocument()
  })
  it('uses actual correction step instead of history length', () => {
    render(
      <WorkflowCurrentState
        mrf={{ ...mrf, workflowCurrentStepNumber: 1 }}
        history={history}
      />,
    )
    expect(
      screen.getByText('Current step: Step 2 (Manager)'),
    ).toBeInTheDocument()
    expect(screen.getByText('manager@agency.gov.sg')).toBeInTheDocument()
    expect(screen.queryByText('finance@agency.gov.sg')).not.toBeInTheDocument()
  })
  it.each([
    [WorkflowStatus.COMPLETED, 'Completed'],
    [WorkflowStatus.REJECTED, 'Rejected'],
  ] as const)('shows terminal %s without actions', (status, label) => {
    render(
      <WorkflowCurrentState
        mrf={{ ...mrf, workflowStatus: status }}
        history={history}
        actions={<button>Void</button>}
      />,
    )
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.queryByText('Current assignees')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
  it('prioritises voided state', () => {
    render(
      <WorkflowCurrentState
        mrf={{ ...mrf, stoppedAt: '2026-11-14T04:00:00Z' }}
        history={history}
      />,
    )
    expect(screen.getByText('Voided')).toBeInTheDocument()
    expect(screen.queryByText('Pending')).not.toBeInTheDocument()
  })
  it('hides actions but keeps assignees', () => {
    render(
      <WorkflowCurrentState
        mrf={mrf}
        history={history}
        showActions={false}
        actions={<button>Remind</button>}
      />,
    )
    expect(screen.getByText('finance@agency.gov.sg')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
  it('omits unknown recipients and empty action section', () => {
    render(
      <WorkflowCurrentState
        mrf={{ ...mrf, workflowCurrentStepNumber: 0 }}
        history={{ ...history, workflow: [{ _id: '1' }] }}
      />,
    )
    expect(screen.getByText('Current step: Step 1')).toBeInTheDocument()
    expect(screen.queryByText('Current assignees')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
  it('does not invent state for missing metadata', () => {
    const { container } = render(
      <WorkflowCurrentState mrf={undefined} history={history} />,
    )
    expect(container).not.toHaveTextContent('Current step')
  })
})
describe('getCurrentStepRecipients', () => {
  it('uses latest Step 1 correction event including FixStep', () =>
    expect(
      getCurrentStepRecipients(
        {
          ...history,
          workflowEvents: [
            event(WorkflowEventType.SentBack, 1, ['old@agency.gov.sg']),
            event(WorkflowEventType.FixStep, 1, ['new@agency.gov.sg']),
          ],
        },
        1,
      ),
    ).toEqual(['new@agency.gov.sg']))
  it('preserves accumulated additional assignees across cycles', () =>
    expect(
      getCurrentStepRecipients(
        {
          ...history,
          workflowEvents: [
            event(WorkflowEventType.AssigneesAdded, 2, ['Extra@agency.gov.sg']),
            event(WorkflowEventType.SentBack, 1, ['applicant@agency.gov.sg']),
            event(WorkflowEventType.AssigneesAdded, 2, [
              'other@agency.gov.sg',
              'extra@agency.gov.sg',
            ]),
          ],
        },
        2,
      ),
    ).toEqual([
      'manager@agency.gov.sg',
      'extra@agency.gov.sg',
      'other@agency.gov.sg',
    ]))
})
