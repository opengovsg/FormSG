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

describe('two-step conversion', () => {
  beforeEach(() => {
    mutation.isLoading = false
    mutation.mutate.mockReset()
  })
  it('blocks dismissal and repeated confirmation while saving', () => {
    const onClose = vi.fn()
    const { rerender } = render(
      <SubmitterIdConversionModal
        authType={FormAuthType.CP}
        isOpen
        onClose={onClose}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'features.common.next' }),
    )
    mutation.isLoading = true
    rerender(
      <SubmitterIdConversionModal
        authType={FormAuthType.CP}
        isOpen
        onClose={onClose}
      />,
    )
    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'features.common.back' }),
    ).toBeDisabled()
    fireEvent.keyDown(screen.getByRole('dialog'), {
      key: 'Escape',
      code: 'Escape',
    })
    const confirm = screen.getByRole('button', { name: /makeTheSwitch/ })
    expect(confirm).toBeDisabled()
    fireEvent.click(confirm)
    expect(
      screen.queryByRole('button', { name: 'Page 1 of 2' }),
    ).not.toBeInTheDocument()
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
  it.each([FormAuthType.SP, FormAuthType.CP])(
    'requires both pages and only saves on final confirmation for %s',
    (authType) => {
      const onClose = vi.fn()
      render(
        <SubmitterIdConversionModal
          authType={authType}
          isOpen
          onClose={onClose}
        />,
      )
      expect(
        screen.queryByRole('button', { name: 'makeTheSwitch' }),
      ).not.toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', { name: 'features.common.next' }),
      )
      expect(mutation.mutate).not.toHaveBeenCalled()
      expect(screen.getByText('preview.outputTitle')).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', { name: 'features.common.back' }),
      )
      expect(
        screen.getByRole('button', { name: 'features.common.next' }),
      ).toBeInTheDocument()
      fireEvent.click(
        screen.getByRole('button', { name: 'features.common.next' }),
      )
      fireEvent.click(screen.getByRole('button', { name: 'makeTheSwitch' }))
      expect(mutation.mutate).toHaveBeenCalledTimes(1)
      // Without success (including a failed request), retain page 2 for retry.
      expect(screen.getByText('preview.outputTitle')).toBeInTheDocument()
      expect(onClose).not.toHaveBeenCalled()
      mutation.mutate.mock.calls[0][1].onSuccess()
      expect(onClose).toHaveBeenCalledTimes(1)
    },
  )
  it('resets to page 1 when reopened', () => {
    const onClose = vi.fn()
    const props = { authType: FormAuthType.CP, onClose }
    const { rerender } = render(
      <SubmitterIdConversionModal {...props} isOpen />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'features.common.next' }),
    )
    rerender(<SubmitterIdConversionModal {...props} isOpen={false} />)
    rerender(<SubmitterIdConversionModal {...props} isOpen />)
    expect(
      screen.getByRole('button', { name: 'features.common.next' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'makeTheSwitch' }),
    ).not.toBeInTheDocument()
  })
})
