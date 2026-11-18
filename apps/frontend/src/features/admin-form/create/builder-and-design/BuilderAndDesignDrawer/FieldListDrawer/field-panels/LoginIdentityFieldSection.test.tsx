import { fireEvent, render, screen } from '@testing-library/react'

import { FormAuthType, FormStatus } from 'formsg-shared/types/form'
import { getLoginIdentityAttrsForAuthType } from 'formsg-shared/utils/login-identity'

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

const renderSection = (authType = state.form.authType) =>
  render(
    <LoginIdentityFieldSection
      attrs={getLoginIdentityAttrsForAuthType(authType as FormAuthType)}
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
  it.each([FormAuthType.MyInfo, FormAuthType.CP])(
    'blocks legacy public %s forms and explains how to proceed',
    (authType) => {
      state.form.authType = authType
      state.form.status = FormStatus.Public
      renderSection()
      for (const row of screen.getAllByRole('button')) {
        expect(row).toBeDisabled()
        fireEvent.click(row)
      }
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(
        screen.getByText('Close your form to convert.'),
      ).toBeInTheDocument()
    },
  )
  it.each([FormAuthType.MyInfo, FormAuthType.CP])(
    'allows normal field creation on converted public %s forms',
    (authType) => {
      state.form.authType = authType
      state.form.status = FormStatus.Public
      state.form.isSubmitterIdCollectionEnabled = false
      renderSection()
      for (const row of screen.getAllByRole('button')) {
        expect(row).not.toBeDisabled()
        expect(row).toHaveAttribute('data-converts', 'false')
        expect(row).toHaveAttribute('data-drag-disabled', 'false')
      }
      expect(
        screen.queryByText('Close your form to convert.'),
      ).not.toBeInTheDocument()
    },
  )
  it('preserves normal field creation and dragging after switching', () => {
    state.form.isSubmitterIdCollectionEnabled = false
    renderSection()
    expect(screen.getByRole('button')).toHaveAttribute('data-converts', 'false')
    expect(screen.getByRole('button')).toHaveAttribute(
      'data-drag-disabled',
      'false',
    )
  })
  const expectBlocked = () => {
    expect(screen.getByRole('button')).toBeDisabled()
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  }
  it('blocks attrs the form login does not offer', () => {
    state.form.authType = FormAuthType.CP
    renderSection(FormAuthType.MyInfo)
    expectBlocked()
  })
  it('blocks the picker at the login field limit', () => {
    state.atLimit = true
    renderSection()
    expectBlocked()
  })
})
