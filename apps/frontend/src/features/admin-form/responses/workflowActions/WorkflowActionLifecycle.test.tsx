import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SubmissionMrfMetadata, WorkflowStatus } from 'formsg-shared/types'

import { render } from '~/test-utils'

import { useWorkflowReminder } from './RemindButton'
import { WorkflowActionsSection } from './WorkflowActionsSection'

vi.mock('react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-query')>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))
const { settings } = vi.hoisted(() => ({ settings: { emails: [] } }))
vi.mock('~features/admin-form/settings/queries', () => ({
  useAdminFormSettings: () => ({ data: settings }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key.split('.').pop() }),
}))
vi.mock('../queries', () => ({
  adminFormResponsesKeys: {
    individual: (form: string, submission: string) => [
      'response',
      form,
      submission,
    ],
  },
}))
vi.mock('react-router-dom', () => ({ useParams: () => ({ formId: 'form' }) }))
vi.mock('./useWorkflowActionsGate', () => ({
  useWorkflowActionsGate: () => true,
  useWorkflowActionsSendBackGate: () => false,
}))
vi.mock('~features/admin-form/common/queries', () => ({
  adminFormKeys: { base: ['adminForm'] },
  useAdminFormCollaborators: () => ({ hasEditAccess: true }),
  useAdminForm: () => ({ data: { authType: 'NIL' } }),
}))
vi.mock('~features/admin-form/responses/hooks', () => ({
  useIsDelightfulDashboard: () => true,
}))
vi.mock('./mutations', () => ({
  useStopWorkflowMutation: () => ({ mutate: vi.fn(), isLoading: false }),
  useAddAssigneesMutation: () => ({ mutate: vi.fn(), isLoading: false }),
  useSendBackWorkflowMutation: () => ({ mutate: vi.fn(), isLoading: false }),
  useFixStepMutation: () => ({ mutate: vi.fn(), isLoading: false }),
}))
vi.mock('~features/admin-form/common/mutations', () => ({
  useFormRemindersMutations: () => ({
    sendReminderForResponseMutation: {
      isLoading: false,
      mutate: (_: unknown, options: { onSuccess: () => void }) =>
        options.onSuccess(),
    },
  }),
}))

const ReminderFixture = ({
  enabled = true,
  token = 'first',
  targetStep = 2,
}: {
  enabled?: boolean
  token?: string
  targetStep?: number
}) => {
  const reminder = useWorkflowReminder({
    formId: 'form',
    submissionId: 'response',
    submissionSecretKey: 'key',
    stepToken: token,
    recipients: ['a@example.gov.sg'],
    enabled,
    targetStep,
  })
  return (
    <>
      <button onClick={reminder.onOpen}>Open reminder</button>
      <span>{reminder.isSent ? 'Sent' : 'Ready'}</span>
      {reminder.modal}
    </>
  )
}
const send = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Open reminder' }))
  await userEvent.click(screen.getByRole('button', { name: 'confirm' }))
  expect(screen.getByText('Sent')).toBeVisible()
}

it('allows another reminder after correction disables and re-enables the action', async () => {
  const { rerender } = render(<ReminderFixture />)
  await send()
  rerender(<ReminderFixture enabled={false} />)
  rerender(<ReminderFixture />)
  expect(screen.getByText('Ready')).toBeVisible()
})
it('resets reminder status for a new token or target step', async () => {
  const { rerender } = render(<ReminderFixture />)
  await send()
  rerender(<ReminderFixture token="second" />)
  expect(screen.getByText('Ready')).toBeVisible()
  await send()
  rerender(<ReminderFixture token="second" targetStep={3} />)
  expect(screen.getByText('Ready')).toBeVisible()
})
it('restores heading focus when terminal refresh arrives while Void is open', async () => {
  const pending: SubmissionMrfMetadata = {
    workflowStatus: WorkflowStatus.PENDING,
    workflowCurrentStepNumber: 1,
    workflowNumTotalSteps: 3,
    hasNextStepRecipientEmails: true,
    lastSubmittedAt: undefined,
  }
  const props = {
    submissionId: 'response',
    history: { submittedSteps: [], workflow: [] },
    submissionSecretKey: 'key',
    isLoading: false,
  }
  const content = (mrf: SubmissionMrfMetadata) => (
    <>
      <h2 tabIndex={-1} data-workflow-response-heading>
        Response #109
      </h2>
      <WorkflowActionsSection {...props} mrf={mrf} />
    </>
  )
  const { rerender } = render(content(pending))
  await userEvent.click(screen.getByRole('button', { name: 'stopButton' }))
  await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible())
  rerender(content({ ...pending, workflowStatus: WorkflowStatus.COMPLETED }))
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Response #109' }),
    ).toHaveFocus(),
  )
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
