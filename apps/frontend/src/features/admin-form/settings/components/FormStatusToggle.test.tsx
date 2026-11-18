import { composeStories } from '@storybook/react-vite'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as pageStories from '../SettingsGeneralPage.stories'

const { OpeningFormWithoutOrigin, OpeningFormWithOrigin } =
  composeStories(pageStories)

const SECRET_KEY_LABEL = 'Enter or upload Secret Key'

const turnFormOn = async (Story: typeof OpeningFormWithoutOrigin) => {
  await act(async () => {
    render(<Story />)
  })
  const user = userEvent.setup()
  await user.click(
    await screen.findByRole('checkbox', { name: 'Toggle form status' }),
  )
  return user
}

describe('opening a form', () => {
  it('asks how it was collected before FormSG, then the secret key, when the form has no origin', async () => {
    const user = await turnFormOn(OpeningFormWithoutOrigin)

    expect(
      await screen.findByText('Before FormSG, how did you collect this?'),
    ).toBeInTheDocument()
    expect(screen.queryByText(SECRET_KEY_LABEL)).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: 'Digitally' }))
    await user.click(screen.getByRole('button', { name: /next step/i }))

    expect(await screen.findByText(SECRET_KEY_LABEL)).toBeInTheDocument()
  })

  it('goes straight to the secret key when the form already has an origin', async () => {
    await turnFormOn(OpeningFormWithOrigin)

    expect(await screen.findByText(SECRET_KEY_LABEL)).toBeInTheDocument()
    expect(
      screen.queryByText('Before FormSG, how did you collect this?'),
    ).not.toBeInTheDocument()
  })
})
