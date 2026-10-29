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
it('blocks publication of an unresolved authentication field and names the field', () => {
  setup()
  expect(screen.getByRole('checkbox')).toBeDisabled()
  expect(screen.getByText(/Company UEN.*must be assigned/)).toBeInTheDocument()
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
