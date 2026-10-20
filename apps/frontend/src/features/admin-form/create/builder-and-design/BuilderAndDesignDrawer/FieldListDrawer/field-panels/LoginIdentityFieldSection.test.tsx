import { fireEvent, render, screen } from '@testing-library/react'

import { MyInfoAttribute } from 'formsg-shared/types/field'
import { FormAuthType, FormStatus } from 'formsg-shared/types/form'

import { LoginIdentityFieldSection } from './LoginIdentityFieldSection'

const state = vi.hoisted(() => ({
  form: {
    authType: 'MyInfo',
    status: 'PRIVATE',
    isSubmitterIdCollectionEnabled: true,
    form_fields: [],
  },
  atLimit: false,
}))
vi.mock('../../../useCreateTabForm', () => ({
  useCreateTabForm: () => ({ data: state.form, isLoading: false }),
}))
vi.mock('./useLoginFieldLimit', () => ({
  useLoginFieldLimit: () => ({ isAtLimit: state.atLimit }),
}))
vi.mock('./useOfferedLoginIdentityAttrs', () => ({
  useOfferedLoginIdentityAttrs: (attrs: string[]) =>
    attrs.map((attr, originalIndex) => ({ attr, originalIndex })),
}))
vi.mock('@hello-pangea/dnd', () => ({
  Droppable: ({ children }: { children: (value: object) => React.ReactNode }) =>
    children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }),
}))
vi.mock('../FieldListOption', () => ({
  DraggableLoginIdentityFieldListOption: ({
    isDisabled,
    isDragDisabled,
    onConvert,
  }: {
    isDisabled: boolean
    isDragDisabled: boolean
    onConvert?: () => void
  }) => (
    <button
      disabled={isDisabled}
      data-drag-disabled={String(isDragDisabled)}
      data-converts={String(!!onConvert)}
      onClick={onConvert}
    >
      NRIC/FIN
    </button>
  ),
}))
vi.mock(
  '~features/admin-form/settings/components/AuthSettingsSection/SubmitterIdConversionModal',
  () => ({
    SubmitterIdConversionModal: ({ isOpen }: { isOpen: boolean }) =>
      isOpen ? <div role="dialog">Switch fields</div> : null,
  }),
)

const renderSection = () =>
  render(
    <LoginIdentityFieldSection
      attrs={[MyInfoAttribute.UinFin]}
      droppableId="identity"
      searchValue=""
      withSectionLabel={false}
    />,
  )

describe('identity picker conversion entry', () => {
  beforeEach(() => {
    state.form.authType = FormAuthType.MyInfo
    state.form.status = FormStatus.Private
    state.form.isSubmitterIdCollectionEnabled = true
    state.atLimit = false
  })
  it('allows legacy clicks but prevents dragging into normal field creation', () => {
    renderSection()
    const row = screen.getByRole('button', { name: 'NRIC/FIN' })
    expect(row).not.toBeDisabled()
    expect(row).toHaveAttribute('data-drag-disabled', 'true')
    fireEvent.click(row)
    expect(screen.getByRole('dialog')).toHaveTextContent('Switch fields')
  })
  it('blocks interaction for a public form', () => {
    state.form.status = FormStatus.Public
    renderSection()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('preserves normal field creation and dragging after switching', () => {
    state.form.isSubmitterIdCollectionEnabled = false
    renderSection()
    expect(screen.getByRole('button')).toHaveAttribute('data-converts', 'false')
    expect(screen.getByRole('button')).toHaveAttribute(
      'data-drag-disabled',
      'false',
    )
  })
  it.each(['auth', 'limit'])('preserves the %s blocker', (blocker) => {
    if (blocker === 'auth') state.form.authType = FormAuthType.CP
    else state.atLimit = true
    renderSection()
    expect(screen.getByRole('button')).toBeDisabled()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
