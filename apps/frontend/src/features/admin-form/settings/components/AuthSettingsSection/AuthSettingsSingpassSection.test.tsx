import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import {
  FormAuthType,
  FormResponseMode,
  FormSettings,
} from 'formsg-shared/types/form'

import { AuthSettingsSingpassSection } from './AuthSettingsSingpassSection'

const state = vi.hoisted(() => ({
  save: (() => {}) as (enabled: boolean) => void,
}))
vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: () => true,
  useGrowthBook: () => undefined,
}))
vi.mock('../../mutations', () => ({
  useMutateFormSettings: () => ({
    mutateIsSubmitterIdCollectionEnabled: {
      isLoading: false,
      mutateAsync: async (enabled: boolean) => state.save(enabled),
    },
  }),
}))
vi.mock('./SubmitterIdConversionModal', () => ({
  SubmitterIdConversionModal: () => null,
}))
vi.mock('./SingpassAuthOptionsRadio', () => ({
  SingpassAuthOptionsRadio: () => null,
}))
vi.mock('./FormSingleSubmissionToggle', () => ({
  FormSingleSubmissionToggle: () => null,
}))
vi.mock('./FormWhitelistAttachmentField', () => ({
  FormWhitelistAttachmentField: () => null,
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const Harness = ({ initiallyEnabled = true }) => {
  const [enabled, setEnabled] = useState(initiallyEnabled)
  state.save = setEnabled
  return (
    <MemoryRouter>
      <button onClick={() => setEnabled(false)}>
        Collaborator stopped collection
      </button>
      <AuthSettingsSingpassSection
        settings={
          {
            authType: FormAuthType.CP,
            responseMode: FormResponseMode.Multirespondent,
            isSubmitterIdCollectionEnabled: enabled,
          } as FormSettings
        }
        isFormPublic={false}
        hasLoginFields={false}
        hasIdentityFields={false}
      />
    </MemoryRouter>
  )
}

describe('focus after stopping collection', () => {
  it('focuses the fields action after the successful cache update unmounts the stop modal', async () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'stopCollecting' }))
    await waitFor(() =>
      expect(
        screen.getByRole('link', { name: 'corppass.goToFields' }),
      ).toHaveFocus(),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('does not steal focus after a collaborator or refetch updates collection', async () => {
    render(<Harness />)
    const otherAction = screen.getByRole('button', {
      name: 'Collaborator stopped collection',
    })
    otherAction.focus()
    fireEvent.click(otherAction)
    await screen.findByRole('link', { name: 'corppass.goToFields' })
    expect(otherAction).toHaveFocus()
  })
  it('does not steal focus when opening an already-switched form', () => {
    render(<Harness initiallyEnabled={false} />)
    expect(
      screen.getByRole('link', { name: 'corppass.goToFields' }),
    ).not.toHaveFocus()
  })
})
