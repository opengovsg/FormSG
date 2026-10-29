import { ChakraProvider } from '@chakra-ui/react'
import { fireEvent, render, screen } from '@testing-library/react'

import {
  BasicField,
  CorppassAttribute,
  FormAuthType,
  FormResponseMode,
  FormStatus,
  WorkflowType,
} from 'formsg-shared/types'

import { FormStatusToggle } from './FormStatusToggle'

const state = vi.hoisted(() => ({
  form: {} as Record<string, unknown>,
  settings: undefined as Record<string, unknown> | undefined,
  mutate: vi.fn(),
}))
vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({ data: state.form, isLoading: false }),
}))
vi.mock('../queries', () => ({
  useAdminFormSettings: () => ({
    data: state.settings ?? state.form,
    isLoading: false,
  }),
}))
vi.mock('../mutations', () => ({
  useMutateFormSettings: () => ({
    mutateFormStatus: { mutate: state.mutate, isLoading: false },
  }),
}))
vi.mock(
  '~features/admin-form/create/workflow/hooks/useIncompleteWorkflowStepLabels',
  () => ({ useIncompleteWorkflowStepLabels: () => [] }),
)
vi.mock('./EmailModeConvertModal', () => ({
  EmailModeConvertModal: () => null,
}))
vi.mock('./IncompleteWorkflowModal', () => ({
  IncompleteWorkflowModal: () => null,
}))
vi.mock('./SecretKeyActivationModal', () => ({
  SecretKeyActivationModal: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>Activation confirmation</div> : null,
}))

const setup = () =>
  render(
    <ChakraProvider>
      <FormStatusToggle />
    </ChakraProvider>,
  )
beforeEach(() => {
  vi.clearAllMocks()
  state.settings = undefined
  state.form = {
    _id: 'form',
    status: FormStatus.Private,
    responseMode: FormResponseMode.Multirespondent,
    authType: FormAuthType.CP,
    esrvcId: 'service',
    isSubmitterIdCollectionEnabled: false,
    form_fields: [
      {
        _id: 'uen',
        title: 'Company UEN',
        fieldType: BasicField.Uen,
        corppass: { attr: CorppassAttribute.Uen },
      },
    ],
    workflow: [
      {
        _id: 'step',
        workflow_type: WorkflowType.Static,
        edit: [],
        emails: [],
        auth: { auth_type: FormAuthType.CP, esrvc_id: 'service' },
      },
    ],
  }
})
it('blocks publication when no step supplies the required provider and names the field', () => {
  state.form.authType = FormAuthType.NIL
  setup()
  expect(screen.getByRole('checkbox')).toBeDisabled()
  expect(screen.getAllByText(/Company UEN.*Corppass/).length).toBeGreaterThan(0)
  expect(screen.queryByText('Activation confirmation')).not.toBeInTheDocument()
  expect(state.mutate).not.toHaveBeenCalled()
})
it('allows the activation confirmation after the field has a matching owner', () => {
  state.form.workflow = [
    {
      _id: 'step',
      workflow_type: WorkflowType.Static,
      edit: ['uen'],
      emails: [],
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'service' },
    },
  ]
  setup()
  const toggle = screen.getByRole('checkbox')
  expect(toggle).not.toBeDisabled()
  fireEvent.click(toggle)
  expect(screen.getByText('Activation confirmation')).toBeInTheDocument()
})
it('keeps closing an already-public form available', () => {
  state.form.status = FormStatus.Public
  setup()
  const toggle = screen.getByRole('checkbox')
  expect(toggle).not.toBeDisabled()
  fireEvent.click(toggle)
  expect(state.mutate).toHaveBeenCalledWith(FormStatus.Private)
})

it('allows closing while the form cache still has the previous private draft', () => {
  state.settings = { ...state.form, status: FormStatus.Public }
  setup()
  const toggle = screen.getByRole('checkbox')
  expect(toggle).not.toBeDisabled()
  fireEvent.click(toggle)
  expect(state.mutate).toHaveBeenCalledWith(FormStatus.Private)
})

it('allows publication with an unassigned authentication field when a matching provider exists', () => {
  setup()
  const toggle = screen.getByRole('checkbox')
  expect(toggle).not.toBeDisabled()
  expect(
    screen.queryByText('Finish authentication setup before publishing'),
  ).not.toBeInTheDocument()
  fireEvent.click(toggle)
  expect(screen.getByText('Activation confirmation')).toBeInTheDocument()
})
it('allows unassigned fields supplied by a later step with a different provider from Step 1', () => {
  state.form.authType = FormAuthType.MyInfo
  state.form.workflow = [
    {
      _id: 'requester',
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: [],
    },
    {
      _id: 'company',
      workflow_type: WorkflowType.Static,
      edit: [],
      emails: ['officer@example.gov.sg'],
      auth: { auth_type: FormAuthType.CP, esrvc_id: 'service' },
    },
  ]
  setup()
  expect(screen.getByRole('checkbox')).not.toBeDisabled()
  expect(
    screen.queryByText('Finish authentication setup before publishing'),
  ).not.toBeInTheDocument()
})
