import { MemoryRouter, useLocation } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FormAuthType, FormResponseMode, FormStatus } from 'formsg-shared/types'
import { getLoginIdentityAttrsForAuthType } from 'formsg-shared/utils/login-identity'

import { LoginIdentityFieldSection } from './LoginIdentityFieldSection'
import { MyInfoFieldPanel } from './MyInfoPanel'

const state = vi.hoisted(() => ({
  form: {
    authType: 'NIL',
    responseMode: 'multirespondent',
    status: 'PRIVATE',
    isSubmitterIdCollectionEnabled: false,
    form_fields: [],
    workflow: [] as object[],
  },
  flag: true,
  loading: false,
  atLimit: false,
  dirty: false,
  createField: vi.fn(),
  workflowClick: vi.fn(),
}))
vi.mock('../../../useCreateTabForm', () => ({
  useCreateTabForm: () => ({ data: state.form, isLoading: state.loading }),
}))
vi.mock('../../../useFieldBuilderStore', () => ({
  useFieldBuilderStore: () => state.createField,
  updateCreateStateSelector: vi.fn(),
}))
vi.mock('../../../useDirtyFieldStore', () => ({
  useDirtyFieldStore: () => state.dirty,
  isDirtySelector: vi.fn(),
}))
vi.mock('~features/admin-form/create/common/CreatePageSidebarContext', () => ({
  useCreatePageSidebar: () => ({ handleWorkflowClick: state.workflowClick }),
}))
vi.mock(
  '~features/admin-form/create/workflow/hooks/useIsMrfStepLoginEnabled',
  () => ({
    useIsMrfStepLoginEnabled: () => state.flag,
  }),
)
vi.mock(
  '~features/admin-form/create/workflow/hooks/useUsesStepLoginRules',
  () => ({
    useUsesStepLoginRules: () => state.flag,
  }),
)
vi.mock('./useLoginFieldLimit', () => ({
  useLoginFieldLimit: () => ({ isAtLimit: state.atLimit, count: 0, max: 30 }),
}))
vi.mock('./useOfferedLoginIdentityAttrs', () => ({
  useOfferedLoginIdentityAttrs: (attrs: string[]) =>
    attrs.map((attr, originalIndex) => ({ attr, originalIndex })),
}))
vi.mock('@hello-pangea/dnd', () => ({
  Droppable: ({ children }: { children: (value: object) => React.ReactNode }) =>
    children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }),
  Draggable: ({
    children,
    isDragDisabled,
  }: {
    children: (provided: object, snapshot: object) => React.ReactNode
    isDragDisabled: boolean
  }) =>
    children(
      {
        innerRef: vi.fn(),
        draggableProps: { 'data-drag-disabled': String(isDragDisabled) },
        dragHandleProps: {},
      },
      {},
    ),
}))
vi.mock(
  '~features/admin-form/settings/components/AuthSettingsSection/SubmitterIdConversionModal',
  () => ({
    SubmitterIdConversionModal: () => null,
  }),
)
const Location = () => (
  <div data-testid="location">{useLocation().pathname}</div>
)
const renderPicker = (provider = FormAuthType.MyInfo, myInfo = false) =>
  render(
    <MemoryRouter initialEntries={['/admin/form/create']}>
      {myInfo ? (
        <MyInfoFieldPanel searchValue="Name" />
      ) : (
        <LoginIdentityFieldSection
          attrs={getLoginIdentityAttrsForAuthType(provider)}
          droppableId="identity"
          searchValue=""
          withSectionLabel={false}
        />
      )}
      <Location />
    </MemoryRouter>,
  )
const clickField = (name = 'NRIC/FIN') =>
  fireEvent.click(screen.getByText(name))

describe('login setup from fields', () => {
  beforeEach(() => {
    Object.assign(state.form, {
      authType: FormAuthType.NIL,
      responseMode: FormResponseMode.Multirespondent,
      status: FormStatus.Private,
      isSubmitterIdCollectionEnabled: false,
      workflow: [],
    })
    state.flag = true
    state.loading = false
    state.atLimit = false
    state.dirty = false
    vi.clearAllMocks()
  })
  it.each([FormAuthType.MyInfo, FormAuthType.CP])(
    'guides missing %s to Login Settings without creating a field',
    (provider) => {
      renderPicker(provider)
      clickField()
      expect(screen.getByRole('dialog')).toHaveTextContent(
        'in Login Settings to use this field.',
      )
      expect(state.createField).not.toHaveBeenCalled()
      fireEvent.click(
        screen.getByRole('button', { name: 'Go to Login Settings' }),
      )
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/settings/singpass',
      )
      expect(state.workflowClick).not.toHaveBeenCalled()
    },
  )
  it.each([0, 1, 2])(
    'routes missing login with %s steps and another login to Workflow',
    (steps) => {
      state.form.authType = FormAuthType.CP
      state.form.workflow = Array.from({ length: steps }, () => ({}))
      state.dirty = true
      renderPicker()
      clickField()
      fireEvent.click(screen.getByRole('button', { name: 'Go to Workflow' }))
      expect(state.workflowClick).toHaveBeenCalledWith(true)
      expect(state.createField).not.toHaveBeenCalled()
    },
  )
  it('counts a single step as workflow even without login', () => {
    state.form.workflow = [{}]
    renderPicker()
    clickField()
    fireEvent.click(screen.getByRole('button', { name: 'Go to Workflow' }))
    expect(state.workflowClick).toHaveBeenCalledWith(false)
  })
  it('keeps missing-provider dragging disabled and cancelling makes no change', () => {
    renderPicker()
    expect(screen.getByRole('button', { name: 'NRIC/FIN' })).toHaveAttribute(
      'data-drag-disabled',
      'true',
    )
    clickField()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(state.createField).not.toHaveBeenCalled()
    expect(state.workflowClick).not.toHaveBeenCalled()
  })
  it.each([FormAuthType.MyInfo, FormAuthType.CP])(
    'creates available %s identity fields normally',
    (provider) => {
      state.form.authType = provider
      renderPicker(provider)
      clickField()
      expect(state.createField).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    },
  )
  it.each(['flag', 'legacy', 'encrypt', 'loading', 'limit'])(
    'preserves the %s restriction',
    (restriction) => {
      if (restriction === 'flag') state.flag = false
      if (restriction === 'legacy') {
        state.form.authType = FormAuthType.CP
        state.form.isSubmitterIdCollectionEnabled = true
      }
      if (restriction === 'encrypt')
        state.form.responseMode = FormResponseMode.Encrypt
      if (restriction === 'loading') state.loading = true
      if (restriction === 'limit') state.atLimit = true
      renderPicker()
      clickField()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(state.createField).not.toHaveBeenCalled()
    },
  )
  it.each([false, true])(
    'supports keyboard setup for MyInfo panel=%s',
    async (myInfo) => {
      const user = userEvent.setup()
      renderPicker(FormAuthType.MyInfo, myInfo)
      const option = screen.getByRole('button', {
        name: myInfo ? 'Name' : 'NRIC/FIN',
      })
      option.focus()
      await user.keyboard('{Enter}')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(state.createField).not.toHaveBeenCalled()
    },
  )
  it.each(['flag', 'legacy', 'encrypt', 'loading', 'limit'])(
    'preserves the MyInfo %s restriction',
    (restriction) => {
      if (restriction === 'flag') state.flag = false
      if (restriction === 'legacy') {
        state.form.authType = FormAuthType.CP
        state.form.isSubmitterIdCollectionEnabled = true
      }
      if (restriction === 'encrypt')
        state.form.responseMode = FormResponseMode.Encrypt
      if (restriction === 'loading') state.loading = true
      if (restriction === 'limit') state.atLimit = true
      renderPicker(FormAuthType.MyInfo, true)
      clickField('Name')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(state.createField).not.toHaveBeenCalled()
    },
  )
  it('accepts a draft later-step Corppass login with blank e-service ID while rollout is off', () => {
    state.flag = false
    state.form.workflow = [
      {},
      { auth: { auth_type: FormAuthType.CP, esrvc_id: '' } },
    ]
    renderPicker(FormAuthType.CP)
    clickField()
    expect(state.createField).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('guides MyInfo choices without enabling drag or creating a field', () => {
    renderPicker(FormAuthType.MyInfo, true)
    expect(screen.getByRole('button', { name: 'Name' })).toHaveAttribute(
      'data-drag-disabled',
      'true',
    )
    clickField('Name')
    expect(
      screen.getByRole('button', { name: 'Go to Login Settings' }),
    ).toBeInTheDocument()
    expect(state.createField).not.toHaveBeenCalled()
  })
  it('adds MyInfo normally when Singpass is available', () => {
    state.form.authType = FormAuthType.MyInfo
    renderPicker(FormAuthType.MyInfo, true)
    clickField('Name')
    expect(state.createField).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
