import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import * as pageStories from '../../SettingsAuthPage.stories'

const mockIsCorppassFormsgEsrvcIdEnabled = vi.fn()
vi.mock('../../hooks/useIsCorppassFormsgEsrvcIdEnabled', () => ({
  useIsCorppassFormsgEsrvcIdEnabled: () => mockIsCorppassFormsgEsrvcIdEnabled(),
}))

const { PrivateStorageCorppassFormWithoutEsrvcId } = composeStories(pageStories)

const renderAuthSettings = async () => {
  await act(async () => {
    render(<PrivateStorageCorppassFormWithoutEsrvcId />)
  })
  // The Corppass option renders once settings have loaded.
  await screen.findByRole('radio', { checked: true })
}

describe('Corppass e-service ID setup', () => {
  it('asks for the agency e-service ID and tags Myinfo as free when off', async () => {
    mockIsCorppassFormsgEsrvcIdEnabled.mockReturnValue(false)

    await renderAuthSettings()

    expect(screen.getByLabelText('e-service ID:')).toBeInTheDocument()
    expect(screen.getByText('Free')).toBeInTheDocument()
  }, 20000)

  it("hides the e-service ID and the free tag when Corppass uses FormSG's ID", async () => {
    mockIsCorppassFormsgEsrvcIdEnabled.mockReturnValue(true)

    await renderAuthSettings()

    expect(screen.queryByLabelText('e-service ID:')).not.toBeInTheDocument()
    expect(screen.queryByText('Free')).not.toBeInTheDocument()
  }, 20000)
})
