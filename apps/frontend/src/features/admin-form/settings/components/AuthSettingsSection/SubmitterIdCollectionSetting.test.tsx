import { fireEvent, render, screen } from '@testing-library/react'

import { FormAuthType, FormSettings } from 'formsg-shared/types/form'

import { SubmitterIdCollectionSetting } from './SubmitterIdCollectionSetting'

const mutation = vi.hoisted(() => ({ mutate: vi.fn(), isLoading: false }))
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
    mutation.mutate.mockReset()
    mutation.isLoading = false
  })
  it('requires confirmation and allows cancellation without saving', () => {
    setup()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByText('singpass.stopDescription')).toBeInTheDocument()
    expect(mutation.mutate).not.toHaveBeenCalled()
    fireEvent.click(
      screen.getByRole('button', { name: 'features.common.cancel' }),
    )
    expect(mutation.mutate).not.toHaveBeenCalled()
  })
  it('saves false and waits for success before closing', () => {
    setup(false, FormAuthType.CP)
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByText('corppass.stopDescription')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'stopCollecting' }))
    expect(mutation.mutate).toHaveBeenCalledWith(false, {
      onSuccess: expect.any(Function),
    })
    expect(screen.getByRole('checkbox', { hidden: true })).toBeChecked()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  it('blocks live forms', () => {
    setup(true)
    expect(screen.getByRole('checkbox')).toBeDisabled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
