import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { FormAuthType } from 'formsg-shared/types/form'

import { SubmitterIdConversionModal } from './SubmitterIdConversionModal'

const viewport = vi.hoisted(() => ({ isMobile: false }))
vi.mock('~hooks/useIsMobile', () => ({
  useIsMobile: () => viewport.isMobile,
}))

const mutation = vi.hoisted(() => ({ isLoading: false, mutate: vi.fn() }))
vi.mock('../../mutations', () => ({
  useMutateFormSettings: () => ({
    mutateConvertSubmitterIdCollection: mutation,
  }),
}))
vi.mock('./ConversionPreview', () => ({
  ConversionFieldPreview: () => <button>Preview 0</button>,
  ConversionResponseChanges: () => <button>Preview 1</button>,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('two-step conversion', () => {
  beforeEach(() => {
    viewport.isMobile = false
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
  it.each([
    { authType: FormAuthType.MyInfo, isMobile: false },
    { authType: FormAuthType.CP, isMobile: true },
  ])(
    'requires both pages and only saves on final confirmation for $authType, mobile=$isMobile',
    ({ authType, isMobile }) => {
      viewport.isMobile = isMobile
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
      expect(screen.getByRole('dialog')).toHaveAccessibleName(
        authType === FormAuthType.CP
          ? 'corppass.outputTitle'
          : 'singpass.outputTitle',
      )
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
      expect(screen.getByRole('dialog')).toHaveAccessibleName(
        authType === FormAuthType.CP
          ? 'corppass.outputTitle'
          : 'singpass.outputTitle',
      )
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
  it('keeps only the active panel accessible', () => {
    render(
      <SubmitterIdConversionModal
        authType={FormAuthType.MyInfo}
        isOpen
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toHaveAccessibleName(
      'singpass.modalTitle',
    )
    expect(
      screen.getByRole('button', { name: 'Preview 0' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Preview 1' }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'features.common.next' }),
    )
    expect(screen.getByRole('dialog')).toHaveAccessibleName(
      'singpass.outputTitle',
    )
    expect(
      screen.getByRole('button', { name: 'Preview 1' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Preview 0' }),
    ).not.toBeInTheDocument()
  })
  it.each([false, true])(
    'does not confirm a rapid second click, mobile=%s',
    (isMobile) => {
      viewport.isMobile = isMobile
      render(
        <SubmitterIdConversionModal
          authType={FormAuthType.CP}
          isOpen
          onClose={vi.fn()}
        />,
      )
      fireEvent.click(
        screen.getByRole('button', { name: 'features.common.next' }),
        { detail: 1 },
      )
      const heading = screen.getByRole('heading', {
        name: 'corppass.outputTitle',
      })
      expect(heading).toHaveFocus()
      fireEvent.click(screen.getByRole('button', { name: 'makeTheSwitch' }), {
        detail: 2,
      })
      expect(mutation.mutate).not.toHaveBeenCalled()
      fireEvent.click(screen.getByRole('button', { name: 'makeTheSwitch' }), {
        detail: 1,
      })
      expect(mutation.mutate).toHaveBeenCalledTimes(1)
    },
  )
  it('moves focus off Next so repeated Enter cannot confirm', async () => {
    const user = userEvent.setup()
    render(
      <SubmitterIdConversionModal
        authType={FormAuthType.CP}
        isOpen
        onClose={vi.fn()}
      />,
    )
    screen.getByRole('button', { name: 'features.common.next' }).focus()
    await user.keyboard('{Enter}{Enter}')
    expect(
      screen.getByRole('heading', { name: 'corppass.outputTitle' }),
    ).toHaveFocus()
    expect(mutation.mutate).not.toHaveBeenCalled()
  })
  it.each(['cancel', 'close', 'escape'])(
    'restores trigger focus on %s',
    async (action) => {
      const user = userEvent.setup()
      const Harness = () => {
        const [isOpen, setIsOpen] = useState(false)
        return (
          <>
            <button onClick={() => setIsOpen(true)}>Open conversion</button>
            <SubmitterIdConversionModal
              authType={FormAuthType.CP}
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </>
        )
      }
      render(<Harness />)
      const trigger = screen.getByRole('button', { name: 'Open conversion' })
      await user.click(trigger)
      if (action === 'escape') await user.keyboard('{Escape}')
      else
        await user.click(
          screen.getByRole('button', {
            name: action === 'cancel' ? 'features.common.cancel' : 'Close',
          }),
        )
      await waitFor(() => expect(trigger).toHaveFocus())
    },
  )
})
