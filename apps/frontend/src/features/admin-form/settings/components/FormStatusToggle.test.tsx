import { composeStories } from '@storybook/react'
import { act, render, screen } from '@testing-library/react'

import * as pageStories from '../SettingsGeneralPage.stories'

const mockIsCorppassFormsgEsrvcIdEnabled = vi.fn()
vi.mock('../hooks/useIsCorppassFormsgEsrvcIdEnabled', () => ({
  useIsCorppassFormsgEsrvcIdEnabled: () => mockIsCorppassFormsgEsrvcIdEnabled(),
}))

const { PrivateCorppassFormWithoutEsrvcId } = composeStories(pageStories)

const BLOCKED_MESSAGE =
  'This form cannot be activated until a valid e-service ID is entered in the Singpass section.'

const renderLoadedSettings = async () => {
  await act(async () => {
    render(<PrivateCorppassFormWithoutEsrvcId />)
  })
  // The toggle renders before settings load, so wait for a settings value.
  await screen.findByDisplayValue('Corppass form')
}

describe('opening a Corppass form without an e-service ID', () => {
  it('is blocked when Corppass uses the agency e-service ID', async () => {
    mockIsCorppassFormsgEsrvcIdEnabled.mockReturnValue(false)

    await renderLoadedSettings()

    expect(screen.getByLabelText('Toggle form status')).toBeDisabled()
    expect(screen.getByText(BLOCKED_MESSAGE)).toBeInTheDocument()
  }, 20000)

  it("is allowed when Corppass uses FormSG's e-service ID", async () => {
    mockIsCorppassFormsgEsrvcIdEnabled.mockReturnValue(true)

    await renderLoadedSettings()

    expect(screen.getByLabelText('Toggle form status')).toBeEnabled()
    expect(screen.queryByText(BLOCKED_MESSAGE)).not.toBeInTheDocument()
  }, 20000)
})
