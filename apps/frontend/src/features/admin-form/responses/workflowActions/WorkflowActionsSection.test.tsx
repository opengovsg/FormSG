import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SubmissionMrfMetadata, WorkflowStatus } from 'formsg-shared/types'

import { render } from '~/test-utils'

import { WorkflowActionsSection } from './WorkflowActionsSection'

let mockIsGateOn = true
let mockHasEditAccess = true
const mockMutate = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}))

vi.mock('react-router-dom', () => ({
  useParams: () => ({ formId: 'mock-form-id' }),
}))

vi.mock('./useWorkflowActionsGate', () => ({
  useWorkflowActionsGate: () => mockIsGateOn,
}))

vi.mock('~features/admin-form/common/queries', () => ({
  useAdminFormCollaborators: () => ({ hasEditAccess: mockHasEditAccess }),
}))

vi.mock('./mutations', () => ({
  useStopWorkflowMutation: () => ({ mutate: mockMutate, isLoading: false }),
}))

vi.mock('./StopWorkflowModal', () => ({
  StopWorkflowModal: ({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean
    onConfirm: (emails: string[]) => void
  }) =>
    isOpen ? (
      <button onClick={() => onConfirm(['lead@agency.gov.sg'])}>
        confirm stop
      </button>
    ) : null,
}))

const STOP =
  'features.adminForm.responses.individualResponse.workflowActions.stopButton'

const pendingMrf = (
  overrides: Partial<NonNullable<SubmissionMrfMetadata>> = {},
): SubmissionMrfMetadata => ({
  workflowStatus: WorkflowStatus.PENDING,
  workflowCurrentStepNumber: 1,
  workflowNumTotalSteps: 3,
  lastSubmittedAt: undefined,
  hasNextStepRecipientEmails: true,
  isWorkflowActionsEligible: true,
  ...overrides,
})

const renderSection = (mrf: SubmissionMrfMetadata = pendingMrf()) =>
  render(
    <WorkflowActionsSection
      submissionId="mock-submission-id"
      mrf={mrf}
      isLoading={false}
    />,
  )

describe('WorkflowActionsSection', () => {
  afterEach(() => {
    mockIsGateOn = true
    mockHasEditAccess = true
    mockMutate.mockReset()
  })

  it('stops the workflow with the chosen emails', async () => {
    renderSection()

    await userEvent.click(screen.getByRole('button', { name: STOP }))
    await userEvent.click(screen.getByRole('button', { name: 'confirm stop' }))

    expect(mockMutate).toHaveBeenCalledWith(
      { submissionId: 'mock-submission-id', emails: ['lead@agency.gov.sg'] },
      expect.anything(),
    )
  })

  it('hides Stop behind the workflow actions gate', () => {
    mockIsGateOn = false
    renderSection()
    expect(screen.queryByRole('button', { name: STOP })).not.toBeInTheDocument()
  })

  it('hides Stop from read-only collaborators', () => {
    mockHasEditAccess = false
    renderSection()
    expect(screen.queryByRole('button', { name: STOP })).not.toBeInTheDocument()
  })

  it('hides Stop once the workflow is stopped', () => {
    renderSection(pendingMrf({ stoppedAt: '2026-10-07T08:00:00.000Z' }))
    expect(screen.queryByRole('button', { name: STOP })).not.toBeInTheDocument()
  })

  it('hides Stop once the workflow is no longer pending', () => {
    renderSection(pendingMrf({ workflowStatus: WorkflowStatus.APPROVED }))
    expect(screen.queryByRole('button', { name: STOP })).not.toBeInTheDocument()
  })
})
