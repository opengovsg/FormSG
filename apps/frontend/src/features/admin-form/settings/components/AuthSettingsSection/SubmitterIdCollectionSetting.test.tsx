import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { FormAuthType, FormSettings } from 'formsg-shared/types/form'

import { SubmitterIdCollectionSetting } from './SubmitterIdCollectionSetting'

const mutation = vi.hoisted(() => ({ mutateAsync: vi.fn(), isLoading: false }))
vi.mock('../../mutations', () => ({
  useMutateFormSettings: () => ({
    mutateIsSubmitterIdCollectionEnabled: mutation,
  }),
}))
vi.mock('./SubmitterIdConversionModal', () => ({
  SubmitterIdConversionModal: () => null,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
const setup = (isFormPublic = false, authType = FormAuthType.MyInfo) =>
  render(
    <SubmitterIdCollectionSetting
      settings={
        { authType, isSubmitterIdCollectionEnabled: true } as FormSettings
      }
      isFormPublic={isFormPublic}
    />,
  )
describe('stop collection', () => {
  beforeEach(() => {
    mutation.mutateAsync.mockReset()
    mutation.isLoading = false
  })
  it('requires confirmation and allows cancellation without saving', () => {
    setup()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByText('singpass.stopDescription')).toBeInTheDocument()
    expect(mutation.mutateAsync).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole('button', { name: 'features.common.cancel' }),
    )
    expect(mutation.mutateAsync).not.toHaveBeenCalled()
  })
  it('saves false and waits for success before closing', () => {
    mutation.mutateAsync.mockReturnValue(new Promise(() => {}))
    setup(false, FormAuthType.CP)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByText('corppass.stopDescription')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'stopCollecting' }))
    expect(mutation.mutateAsync).toHaveBeenCalledWith(false)
    expect(screen.getByRole('checkbox', { hidden: true })).toBeChecked()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('does not report a successful stop after a failed save', async () => {
    mutation.mutateAsync.mockRejectedValue(new Error('Failed'))
    const onStoppedCollecting = vi.fn()
    render(
      <SubmitterIdCollectionSetting
        settings={
          {
            authType: FormAuthType.MyInfo,
            isSubmitterIdCollectionEnabled: true,
          } as FormSettings
        }
        isFormPublic={false}
        onStoppedCollecting={onStoppedCollecting}
      />,
    )
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'stopCollecting' }))
    await waitFor(() => expect(mutation.mutateAsync).toHaveBeenCalledTimes(1))
    expect(onStoppedCollecting).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('blocks live forms', () => {
    setup(true)
    expect(screen.getByRole('checkbox')).toBeDisabled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
