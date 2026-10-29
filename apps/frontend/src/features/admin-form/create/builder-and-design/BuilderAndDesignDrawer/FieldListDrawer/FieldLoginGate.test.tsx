import { ChakraProvider } from '@chakra-ui/react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  BasicField,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  MyInfoAttribute,
} from 'formsg-shared/types'

import { useFieldLoginGate } from './FieldLoginContext'
import { FieldLoginGate } from './FieldLoginGate'

const state = vi.hoisted(() => ({
  form: {} as Record<string, unknown>,
  add: vi.fn(),
  updateStep: vi.fn(),
  updateAuth: vi.fn(),
  invalidate: vi.fn(),
  fetch: vi.fn(),
  setData: vi.fn(),
}))
vi.mock('~features/admin-form/common/AdminViewFormService', () => ({
  getAdminFormView: () => state.fetch(),
}))
vi.mock('~components/Dropdown', () => ({
  DropdownMenuLayerProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  SingleSelect: ({
    name,
    value,
    onChange,
    isDisabled,
    items,
  }: {
    name: string
    value: string
    onChange: (value: string) => void
    isDisabled: boolean
    items: { value: string; label: string }[]
  }) => (
    <select
      id={name}
      value={value}
      disabled={isDisabled}
      onChange={(event) => onChange(event.target.value)}
    >
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  ),
}))
vi.mock('../../useCreateTabForm', () => ({
  useCreateTabForm: () => ({ data: state.form }),
}))
vi.mock('react-router-dom', () => ({
  useParams: () => ({ formId: 'form-id' }),
}))
vi.mock('react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: state.invalidate,
    setQueryData: state.setData,
  }),
}))
vi.mock(
  '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled',
  () => ({ useIsMrfStepLoginEnabled: () => true }),
)
vi.mock('~features/admin-form/create/workflow/FormWorkflowService', () => ({
  updateWorkflowStep: (...args: unknown[]) => state.updateStep(...args),
}))
vi.mock('~features/admin-form/settings/SettingsService', () => ({
  updateFormLogin: (...args: unknown[]) => state.updateAuth(...args),
}))

const AddField = () => {
  const request = useFieldLoginGate()
  return (
    <button onClick={() => request?.(FormAuthType.MyInfo, state.add)}>
      Add Name
    </button>
  )
}
const AddCorppass = () => {
  const request = useFieldLoginGate()
  return (
    <button onClick={() => request?.(FormAuthType.CP, state.add)}>
      Add UEN
    </button>
  )
}
const setup = () =>
  render(
    <ChakraProvider>
      <FieldLoginGate>
        <AddField />
        <AddCorppass />
      </FieldLoginGate>
    </ChakraProvider>,
  )

describe('field builder enable-login gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    state.fetch.mockImplementation(async () => state.form)
    state.updateStep.mockResolvedValue([])
    state.updateAuth.mockResolvedValue({})
    state.invalidate.mockResolvedValue(undefined)
    state.form = {
      authType: FormAuthType.NIL,
      status: FormStatus.Private,
      responseMode: FormResponseMode.Multirespondent,
      isSubmitterIdCollectionEnabled: false,
      form_fields: [],
      workflow: [
        { _id: 'first', edit: [], emails: [], workflow_type: 'static' },
        { _id: 'second', edit: [], emails: [], workflow_type: 'static' },
      ],
    }
  })
  it('adds without a modal when a later step already uses the provider', () => {
    state.form.workflow = [
      { _id: 'first', edit: [] },
      { _id: 'second', edit: [], auth: { auth_type: FormAuthType.MyInfo } },
    ]
    setup()
    fireEvent.click(screen.getByText('Add Name'))
    expect(state.add).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(state.updateStep).not.toHaveBeenCalled()
  })
  it('cancels without saving or creating a field', () => {
    setup()
    fireEvent.click(screen.getByText('Add Name'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(state.add).not.toHaveBeenCalled()
    expect(state.updateStep).not.toHaveBeenCalled()
  })
  it('enables the selected step before adding, without changing its field assignments', async () => {
    setup()
    fireEvent.click(screen.getByText('Add Name'))
    fireEvent.change(screen.getByLabelText('Enable authentication on'), {
      target: { value: '1' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Singpass and add field' }),
    )
    await waitFor(() => expect(state.add).toHaveBeenCalledTimes(1))
    expect(state.updateStep).toHaveBeenCalledWith(
      'form-id',
      1,
      expect.objectContaining({
        edit: [],
        auth: { auth_type: FormAuthType.MyInfo },
      }),
    )
    expect(state.updateStep.mock.invocationCallOrder[0]).toBeLessThan(
      state.add.mock.invocationCallOrder[0],
    )
  })
  it('does not add when enabling login fails', async () => {
    state.updateStep.mockRejectedValue(new Error('Save failed'))
    setup()
    fireEvent.click(screen.getByText('Add Name'))
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Singpass and add field' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed')
    expect(state.add).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('blocks a flat-form switch when fields need its existing provider', () => {
    state.form.responseMode = FormResponseMode.Encrypt
    state.form.authType = FormAuthType.CP
    state.form.form_fields = [
      {
        _id: 'uen',
        fieldType: BasicField.Uen,
        title: 'Company UEN',
        corppass: { attr: 'uen' },
      },
    ]
    setup()
    fireEvent.click(screen.getByText('Add Name'))
    expect(
      screen.getByRole('button', { name: 'Enable Singpass and add field' }),
    ).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Company UEN')
    expect(state.add).not.toHaveBeenCalled()
  })
  it('allows separate unassigned Myinfo fields once Singpass is enabled', () => {
    state.form.authType = FormAuthType.MyInfo
    state.form.form_fields = [
      {
        _id: 'name',
        fieldType: BasicField.ShortText,
        myInfo: { attr: MyInfoAttribute.Name },
      },
    ]
    setup()
    fireEvent.click(screen.getByText('Add Name'))
    expect(state.add).toHaveBeenCalledTimes(1)
  })
  it('includes Corppass service configuration on the chosen step', async () => {
    setup()
    fireEvent.click(screen.getByText('Add UEN'))
    fireEvent.change(screen.getByLabelText(/Corppass e-service ID/), {
      target: { value: 'service-123' },
    })
    fireEvent.change(screen.getByLabelText('Enable authentication on'), {
      target: { value: '1' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Corppass and add field' }),
    )
    await waitFor(() => expect(state.add).toHaveBeenCalledTimes(1))
    expect(state.updateStep).toHaveBeenCalledWith(
      'form-id',
      1,
      expect.objectContaining({
        auth: { auth_type: FormAuthType.CP, esrvc_id: 'service-123' },
      }),
    )
  })
  it('rejects an edit made while the dialog was open without overwriting it', async () => {
    setup()
    fireEvent.click(screen.getByText('Add Name'))
    state.fetch.mockResolvedValue({
      ...state.form,
      form_fields: [{ _id: 'new-field' }],
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Singpass and add field' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The form changed',
    )
    expect(state.updateStep).not.toHaveBeenCalled()
    expect(state.add).not.toHaveBeenCalled()
  })
  it('saves flat Corppass auth and service ID in one request before addition', async () => {
    state.form.responseMode = FormResponseMode.Encrypt
    setup()
    fireEvent.click(screen.getByText('Add UEN'))
    fireEvent.change(screen.getByLabelText(/Corppass e-service ID/), {
      target: { value: 'service-123' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Corppass and add field' }),
    )
    await waitFor(() => expect(state.add).toHaveBeenCalledTimes(1))
    expect(state.updateAuth).toHaveBeenCalledWith(
      'form-id',
      FormAuthType.CP,
      'service-123',
    )
    expect(state.updateStep).not.toHaveBeenCalled()
  })
  it('reports a saved workflow login if opening the field draft fails', async () => {
    state.add.mockImplementationOnce(() => {
      throw new Error('Draft failed')
    })
    setup()
    fireEvent.click(screen.getByText('Add Name'))
    fireEvent.click(
      screen.getByRole('button', { name: 'Enable Singpass and add field' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Authentication was enabled',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(state.updateStep).toHaveBeenCalledTimes(1)
    expect(state.invalidate).toHaveBeenCalled()
  })
})
