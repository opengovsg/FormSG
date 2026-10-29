import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormSettings,
  WorkflowType,
} from 'formsg-shared/types'

import { StepLoginAccordion } from './StepLoginAccordion'

vi.mock(
  '~features/admin-form/create/workflow/hooks/useWorkflowSurfaces',
  () => ({
    useWorkflowSurfaces: () => ({
      cardRadius: '8px',
      activeCardBg: 'primary.50',
    }),
  }),
)
vi.mock(
  '~features/admin-form/create/workflow/components/WorkflowContent/StepLabel',
  () => ({
    StepLabel: ({
      stepNumber,
      stepName,
    }: {
      stepNumber: number
      stepName: string
    }) => (
      <span>
        {stepNumber + 1} {stepName}
      </span>
    ),
  }),
)
vi.mock('./StepAuthSettingsEditor', () => ({
  StepAuthSettingsEditor: ({
    stepIndex,
    onClose,
    onDirtyChange,
  }: {
    stepIndex: number
    onClose: () => void
    onDirtyChange: (value: boolean) => void
  }) => (
    <div data-testid={`editor-${stepIndex}`}>
      <button onClick={() => onDirtyChange(true)}>Change login</button>
      <button onClick={onClose}>Cancel editor</button>
    </div>
  ),
}))

const settings = { authType: FormAuthType.MyInfo } as FormSettings
const form = {
  workflow: [
    {
      _id: 'one',
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: [],
      step_name: 'Requester',
    },
    {
      _id: 'two',
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: [],
      step_name: 'Approver',
      auth: { auth_type: FormAuthType.CP },
    },
    {
      _id: 'three',
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: [],
      step_name: 'Processing officer',
    },
  ],
} as unknown as AdminMultirespondentFormDto

const setup = () =>
  render(
    <MemoryRouter>
      <StepLoginAccordion form={form} settings={settings} />
    </MemoryRouter>,
  )

describe('workflow-shaped authentication settings', () => {
  it('starts collapsed, shows all provider states, and connects the cards with arrows', () => {
    setup()
    expect(screen.queryByTestId('editor-0')).not.toBeInTheDocument()
    expect(screen.getByText('Singpass')).toBeInTheDocument()
    expect(screen.getByText('Corppass')).toBeInTheDocument()
    expect(screen.getByText('Login not enabled')).toBeInTheDocument()
    expect(screen.getAllByTestId('settings-step-connector')).toHaveLength(2)
    expect(
      screen.getByRole('button', { name: /Edit workflow in Create/ }),
    ).toBeInTheDocument()
  })

  it('opens one card at a time and cancelling collapses it', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /1 Requester/ }))
    expect(screen.getByTestId('editor-0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /2 Approver/ }))
    expect(screen.queryByTestId('editor-0')).not.toBeInTheDocument()
    expect(screen.getByTestId('editor-1')).toBeInTheDocument()
    fireEvent.click(
      await screen.findByRole('button', { name: 'Cancel editor' }),
    )
    expect(screen.queryByTestId('editor-1')).not.toBeInTheDocument()
  })

  it('asks before discarding an edited card when another card is selected', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /1 Requester/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Change login' }))
    fireEvent.click(screen.getByRole('button', { name: /2 Approver/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('editor-0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(screen.getByTestId('editor-0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /2 Approver/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(screen.queryByTestId('editor-0')).not.toBeInTheDocument()
    expect(screen.getByTestId('editor-1')).toBeInTheDocument()
  })
})
