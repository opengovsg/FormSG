import { QueryClient, QueryClientProvider } from 'react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MultirespondentFormSettings,
  WorkflowType,
} from 'formsg-shared/types'

import { StepAuthSettingsEditor } from './StepAuthSettingsEditor'

const requests = vi.hoisted(() => ({
  update: vi.fn(),
  form: vi.fn(),
  single: vi.fn(),
  whitelist: vi.fn(),
}))
vi.mock('~features/admin-form/common/AdminViewFormService', () => ({
  getAdminFormView: requests.form,
}))
vi.mock('~features/admin-form/create/workflow/FormWorkflowService', () => ({
  updateWorkflowStep: requests.update,
}))
vi.mock('../../SettingsService', () => ({
  updateIsSingleSubmission: requests.single,
  updateFormWhitelistSetting: requests.whitelist,
}))
vi.mock('./SecretKeyDownloadWhitelistFileModal', () => ({
  SecretKeyDownloadWhitelistFileModal: () => null,
}))
vi.mock('./StepLoginControls', () => ({
  hasEsrvcIdWhitespace: (value: string) => /\s/.test(value),
  StepLoginControls: ({
    authType,
    onAuthTypeChange,
    onEsrvcIdChange,
  }: {
    authType: FormAuthType
    onAuthTypeChange: (type: FormAuthType) => void
    onEsrvcIdChange: (id: string) => void
  }) => (
    <>
      <span data-testid="provider">{authType}</span>
      <button onClick={() => onAuthTypeChange(FormAuthType.CP)}>
        Use Corppass
      </button>
      <input
        aria-label="E-service ID"
        onChange={(e) => onEsrvcIdChange(e.target.value)}
      />
    </>
  ),
}))

const settings = {
  authType: FormAuthType.MyInfo,
  esrvcId: '',
  isSingleSubmission: false,
  responseMode: FormResponseMode.Multirespondent,
  status: FormStatus.Private,
} as MultirespondentFormSettings
const steps = [
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
    emails: ['approver@example.gov.sg'],
    step_name: 'Approver',
  },
]
const form = {
  ...settings,
  workflow: steps,
  form_fields: [],
} as unknown as AdminMultirespondentFormDto
const setup = (stepIndex = 1) => {
  const onClose = vi.fn()
  const onDirtyChange = vi.fn()
  const onSavingChange = vi.fn()
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  render(
    // React Query v3 still declares its provider with React 17 children types.
    // @ts-expect-error React 18 children are supported at runtime.
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/form']}>
        <Routes>
          <Route
            path="/:formId"
            element={
              <StepAuthSettingsEditor
                form={form}
                settings={settings}
                step={form.workflow[stepIndex]}
                stepIndex={stepIndex}
                onClose={onClose}
                onDirtyChange={onDirtyChange}
                onSavingChange={onSavingChange}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { onClose, onDirtyChange }
}

describe('step authentication drafts', () => {
  beforeEach(() => {
    requests.form.mockReset().mockResolvedValue(form)
    requests.update.mockReset().mockResolvedValue(steps)
    requests.single.mockReset().mockResolvedValue(settings)
    requests.whitelist.mockReset().mockResolvedValue(settings)
  })

  it('does not save provider changes until Save, and Cancel does not call the server', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    expect(requests.update).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(requests.update).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('saves the provider and e-service ID together without changing respondents or fields', async () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'E-service ID' }), {
      target: { value: 'agency-service' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(requests.update).toHaveBeenCalledWith('form', 1, {
      ...steps[1],
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'agency-service' },
    })
    expect(requests.single).not.toHaveBeenCalled()
    expect(requests.whitelist).not.toHaveBeenCalled()
  })

  it('leaves the card open and reports a failed save', async () => {
    requests.update.mockRejectedValue(new Error('Save failed'))
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('refuses to overwrite a step changed after the card was opened', async () => {
    requests.form.mockResolvedValue({
      ...form,
      workflow: [
        steps[0],
        { ...steps[1], step_name: 'Renamed by collaborator' },
      ],
    })
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Use Corppass' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This step has changed since you opened it.',
    )
    expect(requests.update).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('stages Step 1 restrictions, then reports a partial save if their endpoint fails', async () => {
    requests.single.mockRejectedValue(new Error('Restriction failed'))
    const { onClose } = setup(0)
    fireEvent.click(screen.getByRole('checkbox', { name: /Limit each unique/ }))
    expect(requests.single).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The login was saved, but some Step 1 restrictions could not be saved.',
    )
    expect(requests.single).toHaveBeenCalledWith('form', true)
    expect(onClose).not.toHaveBeenCalled()
  })
})
