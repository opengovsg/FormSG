import { fireEvent, render, screen } from '@testing-library/react'

import { FormAuthType } from 'formsg-shared/types/form'

import { SubmitterIdConversionModal } from './SubmitterIdConversionModal'

const mutation = vi.hoisted(() => ({ isLoading: false, mutate: vi.fn() }))
vi.mock('../../mutations', () => ({
  useMutateFormSettings: () => ({
    mutateConvertSubmitterIdCollection: mutation,
  }),
}))
vi.mock('./ConversionPreview', () => ({
  ConversionPreview: () => <div>Preview</div>,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('conversion pending guard', () => {
  beforeEach(() => {
    mutation.isLoading = false
    mutation.mutate.mockReset()
  })
  it('blocks dismissal and repeated confirmation while saving', () => {
    mutation.isLoading = true
    const onClose = vi.fn()
    render(
      <SubmitterIdConversionModal
        authType={FormAuthType.CP}
        isOpen
        onClose={onClose}
      />,
    )
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'features.common.cancel' }),
    ).toBeDisabled()
    fireEvent.keyDown(screen.getByRole('dialog'), {
      key: 'Escape',
      code: 'Escape',
    })
    const confirm = screen.getAllByRole('button').at(-1)!
    expect(confirm).toBeDisabled()
    fireEvent.click(confirm)
    expect(onClose).not.toHaveBeenCalled()
    expect(mutation.mutate).not.toHaveBeenCalled()
  })
  it('allows cancellation when idle', () => {
    const onClose = vi.fn()
    render(
      <SubmitterIdConversionModal
        authType={FormAuthType.CP}
        isOpen
        onClose={onClose}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'features.common.cancel' }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
