import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SubmissionMrfMetadata, WorkflowStatus } from 'formsg-shared/types'

import { render } from '~/test-utils'

import { WorkflowActionsSection } from './WorkflowActionsSection'

let mockIsGateOn = true
let mockIsSendBackOn = false
let mockAuthType = 'SP'
let mockHasEditAccess = true
let mockIsV2 = true
const mockMutate = vi.fn()
const mockAddAssignees = vi.fn()
const mockSendBack = vi.fn()
const mockFixStep = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values: Record<string, unknown> = {}) => {
      if (key.endsWith('activityLog.stepNumber'))
        return `Step ${values.stepNumber}`
      if (key.endsWith('activityLog.stepNameLabel')) return ` · ${values.name}`
      return key
    },
  }),
}))

vi.mock('react-router-dom', () => ({
  useParams: () => ({ formId: 'mock-form-id' }),
}))

vi.mock('./useWorkflowActionsGate', () => ({
  useWorkflowActionsGate: () => mockIsGateOn,
  useWorkflowActionsSendBackGate: () => mockIsSendBackOn,
}))

vi.mock('~features/admin-form/common/queries', () => ({
  useAdminFormCollaborators: () => ({ hasEditAccess: mockHasEditAccess }),
  useAdminForm: () => ({ data: { authType: mockAuthType } }),
}))

vi.mock('~features/admin-form/responses/hooks', () => ({
  useIsDelightfulDashboard: () => mockIsV2,
}))

vi.mock('./mutations', () => ({
  useStopWorkflowMutation: () => ({ mutate: mockMutate, isLoading: false }),
  useAddAssigneesMutation: () => ({
    mutate: mockAddAssignees,
    isLoading: false,
  }),
  useSendBackWorkflowMutation: () => ({
    mutate: mockSendBack,
    isLoading: false,
  }),
  useFixStepMutation: () => ({ mutate: mockFixStep, isLoading: false }),
}))
vi.mock('./SendBackModal', () => ({
  SendBackModal: ({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean
    onConfirm: (
      params: {
        targetStepNumber: number
        remarks: string
        clearResponses: boolean
      },
      mode: 'sendBack' | 'fixStep',
    ) => void
  }) =>
    isOpen ? (
      <>
        <button
          onClick={() =>
            onConfirm(
              { targetStepNumber: 2, remarks: 'Fix it', clearResponses: true },
              'sendBack',
            )
          }
        >
          confirm send back
        </button>
        <button
          onClick={() =>
            onConfirm(
              { targetStepNumber: 2, remarks: 'Fix it', clearResponses: false },
              'fixStep',
            )
          }
        >
          confirm fix step
        </button>
      </>
    ) : null,
}))
vi.mock('./RemindButton', () => ({
  useWorkflowReminder: () => ({
    isSent: false,
    isLoading: false,
    onOpen: vi.fn(),
    modal: null,
  }),
}))

vi.mock('./AddAssigneeModal', () => ({
  AddAssigneeModal: ({
    isOpen,
    onConfirm,
    stepName,
  }: {
    isOpen: boolean
    stepName: string
    onConfirm: (emails: string[]) => void
  }) =>
    isOpen ? (
      <button
        aria-label="confirm add"
        onClick={() => onConfirm(['new@agency.gov.sg'])}
      >
        confirm add
        <span>{stepName}</span>
      </button>
    ) : null,
}))

vi.mock('./StopWorkflowModal', () => ({
  StopWorkflowModal: ({
    isOpen,
    onConfirm,
  }: {
    isOpen: boolean
    onConfirm: (emails: string[]) => void
  }) => (
    <div data-testid="stop-modal">
      {isOpen ? (
        <button onClick={() => onConfirm(['lead@agency.gov.sg'])}>
          confirm stop
        </button>
      ) : null}
    </div>
  ),
}))

const STOP =
  'features.adminForm.responses.individualResponse.workflowActions.stopButton'
const REASSIGN =
  'features.adminForm.responses.individualResponse.workflowActions.reassignButton'

const pendingMrf = (
  overrides: Partial<NonNullable<SubmissionMrfMetadata>> = {},
): SubmissionMrfMetadata => ({
  workflowStatus: WorkflowStatus.PENDING,
  workflowCurrentStepNumber: 1,
  workflowNumTotalSteps: 3,
  lastSubmittedAt: undefined,
  hasNextStepRecipientEmails: true,
  ...overrides,
})

const renderSection = (
  mrf: SubmissionMrfMetadata = pendingMrf(),
  recipients: string[] = ['lead@agency.gov.sg'],
  withOverview = false,
  submittedStepCount = 1,
  stepName?: string,
) =>
  render(
    <WorkflowActionsSection
      overview={withOverview ? <div>Response overview</div> : undefined}
      submissionId="mock-submission-id"
      mrf={mrf}
      history={{
        submittedSteps: Array.from({ length: submittedStepCount }, () => ({
          isApproval: false as const,
          submittedAt: '2026-10-08T01:00:00.000Z',
          nextStepRecipientEmails: recipients,
        })),
        workflow: [
          { _id: 'step-1' },
          { _id: 'step-2', step_name: stepName },
          { _id: 'step-3' },
          { _id: 'step-4' },
        ],
      }}
      submissionSecretKey="mock-secret-key"
      stepToken="mock-step-token"
      isLoading={false}
    />,
  )

describe('WorkflowActionsSection', () => {
  afterEach(() => {
    mockIsGateOn = true
    mockIsSendBackOn = false
    mockFixStep.mockReset()
    mockAuthType = 'SP'
    mockSendBack.mockReset()
    mockHasEditAccess = true
    mockIsV2 = true
    mockMutate.mockReset()
    mockAddAssignees.mockReset()
  })

  it('keeps the overview alongside eligible actions', () => {
    renderSection(pendingMrf(), ['lead@agency.gov.sg'], true)
    expect(screen.getByText('Response overview')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: STOP })).toBeInTheDocument()
  })

  it.each([
    pendingMrf({ stoppedAt: '2026-10-07T08:00:00.000Z' }),
    pendingMrf({ workflowStatus: WorkflowStatus.APPROVED }),
    pendingMrf({ workflowStatus: WorkflowStatus.REJECTED }),
  ])('keeps the overview without actions for a terminal workflow', (mrf) => {
    renderSection(mrf, [], true)
    expect(screen.getByText('Response overview')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps the overview when no actions are eligible', () => {
    mockIsGateOn = false
    mockIsV2 = false
    renderSection(pendingMrf(), [], true)
    expect(screen.getByText('Response overview')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
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

  it.each([
    ['Finance', 'Step 2 · Finance'],
    [undefined, 'Step 2'],
    ['   ', 'Step 2'],
  ])(
    'uses the pending step name %j in the assignment modal',
    async (name, label) => {
      renderSection(pendingMrf(), ['lead@agency.gov.sg'], false, 1, name)
      await userEvent.click(screen.getByRole('button', { name: REASSIGN }))
      expect(screen.getByText(label)).toBeInTheDocument()
    },
  )

  it('adds assignees with the step link credentials', async () => {
    renderSection()

    await userEvent.click(screen.getByRole('button', { name: REASSIGN }))
    await userEvent.click(screen.getByRole('button', { name: 'confirm add' }))

    expect(mockAddAssignees).toHaveBeenCalledWith(
      {
        submissionId: 'mock-submission-id',
        emails: ['new@agency.gov.sg'],
        submissionSecretKey: 'mock-secret-key',
        stepToken: 'mock-step-token',
        expectedStepNumber: 2,
      },
      expect.anything(),
    )
  })

  it('hides Reassign from read-only collaborators', () => {
    mockHasEditAccess = false
    renderSection()
    expect(
      screen.queryByRole('button', { name: REASSIGN }),
    ).not.toBeInTheDocument()
  })

  it("offers Remind to the pending step's people", () => {
    renderSection()
    expect(
      screen.getByRole('button', { name: /remindButton/ }),
    ).toBeInTheDocument()
  })

  it('hides Remind when the pending step has nobody to remind', () => {
    renderSection(pendingMrf(), [])
    expect(
      screen.queryByRole('button', { name: /^remind/ }),
    ).not.toBeInTheDocument()
  })

  it('offers Remind on the V2 dashboard without workflow actions', () => {
    mockIsGateOn = false
    renderSection()
    expect(
      screen.getByRole('button', { name: /remindButton/ }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: STOP })).not.toBeInTheDocument()
  })

  it('offers Remind to view-only collaborators', () => {
    mockHasEditAccess = false
    renderSection()
    expect(
      screen.getByRole('button', { name: /remindButton/ }),
    ).toBeInTheDocument()
  })

  it('does not mount the Stop modal for view-only collaborators', () => {
    mockHasEditAccess = false
    renderSection()
    expect(screen.queryByTestId('stop-modal')).not.toBeInTheDocument()
  })

  it('mounts the Stop modal for collaborators with edit access', () => {
    renderSection()
    expect(screen.getByTestId('stop-modal')).toBeInTheDocument()
  })

  it('leaves Remind to the table on the V1 dashboard', () => {
    mockIsV2 = false
    renderSection()
    expect(
      screen.queryByRole('button', { name: /^remind/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: STOP })).toBeInTheDocument()
  })

  it('hides Remind once the workflow is stopped', () => {
    renderSection(pendingMrf({ stoppedAt: '2026-10-07T08:00:00.000Z' }))
    expect(
      screen.queryByRole('button', { name: /^remind/ }),
    ).not.toBeInTheDocument()
  })

  describe('Send back', () => {
    const SEND_BACK =
      'features.adminForm.responses.individualResponse.workflowActions.sendBackButton'
    const atStepThree = (overrides = {}) =>
      pendingMrf({ workflowCurrentStepNumber: 2, ...overrides })

    beforeEach(() => {
      mockIsSendBackOn = true
    })

    it('sends back with the pending step the page saw and the step link key', async () => {
      renderSection(atStepThree(), undefined, false, 2)

      await userEvent.click(screen.getByRole('button', { name: SEND_BACK }))
      await userEvent.click(
        screen.getByRole('button', { name: 'confirm send back' }),
      )

      expect(mockSendBack).toHaveBeenCalledWith(
        {
          submissionId: 'mock-submission-id',
          targetStepNumber: 2,
          expectedStepNumber: 3,
          submissionSecretKey: 'mock-secret-key',
          remarks: 'Fix it',
          clearResponses: true,
        },
        expect.anything(),
      )
    })

    it('offers Send back with only the send back flag on', () => {
      mockIsGateOn = false
      renderSection(atStepThree(), undefined, false, 2)

      expect(screen.getByRole('button', { name: SEND_BACK })).toBeVisible()
      expect(
        screen.queryByRole('button', { name: STOP }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: REASSIGN }),
      ).not.toBeInTheDocument()
    })

    it.each([
      ['the send back flag is off', () => (mockIsSendBackOn = false), 2, {}],
      ['the admin cannot edit', () => (mockHasEditAccess = false), 2, {}],
      [
        'step 2 is pending',
        () => undefined,
        1,
        { workflowCurrentStepNumber: 1 },
      ],
      [
        'the recorded steps fall behind the step',
        () => undefined,
        2,
        { workflowCurrentStepNumber: 3 },
      ],
      [
        'the workflow is stopped',
        () => undefined,
        2,
        { stoppedAt: '2026-10-07T08:00:00.000Z' },
      ],
    ])(
      'hides Send back when %s',
      (_label, arrange, submittedStepCount, overrides) => {
        arrange()
        renderSection(
          atStepThree(overrides),
          undefined,
          false,
          submittedStepCount as number,
        )

        expect(
          screen.queryByRole('button', { name: SEND_BACK }),
        ).not.toBeInTheDocument()
      },
    )

    it('offers Send back from step 2 on a form without a login', () => {
      mockAuthType = 'NIL'
      renderSection(
        pendingMrf({ workflowCurrentStepNumber: 1 }),
        undefined,
        false,
        1,
      )

      expect(screen.getByRole('button', { name: SEND_BACK })).toBeVisible()
    })
  })

  describe('Fix step', () => {
    const I18N =
      'features.adminForm.responses.individualResponse.workflowActions'
    const FIX_STEP = `${I18N}.sendBackButton`

    beforeEach(() => {
      mockIsSendBackOn = true
    })

    it('reopens the chosen step against the pending step the page saw', async () => {
      renderSection(
        pendingMrf({ workflowCurrentStepNumber: 2 }),
        undefined,
        false,
        2,
      )

      await userEvent.click(screen.getByRole('button', { name: FIX_STEP }))
      await userEvent.click(
        screen.getByRole('button', { name: 'confirm fix step' }),
      )

      expect(mockFixStep).toHaveBeenCalledWith(
        {
          submissionId: 'mock-submission-id',
          targetStepNumber: 2,
          expectedStepNumber: 3,
          submissionSecretKey: 'mock-secret-key',
          remarks: 'Fix it',
        },
        expect.anything(),
      )
    })

    it('only offers Stop while a step is being fixed', () => {
      renderSection(
        pendingMrf({ workflowCurrentStepNumber: 1 }),
        undefined,
        false,
        3,
      )

      expect(screen.getByRole('button', { name: STOP })).toBeVisible()
      for (const name of [FIX_STEP, `${I18N}.sendBackButton`, REASSIGN]) {
        expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
      }
      expect(
        screen.queryByRole('button', { name: /^remind/ }),
      ).not.toBeInTheDocument()
    })
  })
})
