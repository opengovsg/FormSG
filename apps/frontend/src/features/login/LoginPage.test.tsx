import { composeStories } from '@storybook/react-vite'
import { render, screen } from '@testing-library/react'

import * as stories from './LoginPage.stories'

const { Desktop, WithOneGovSg } = composeStories(stories)

describe('LoginPage', () => {
  it('shows WOG AD and Singpass but not one.gov.sg when the flag is off', async () => {
    render(<Desktop />)

    expect(
      await screen.findByRole('button', { name: /WOG AD/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/can use Singpass login/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Log in with one.gov.sg' }),
    ).not.toBeInTheDocument()
  })

  it('shows only email and one.gov.sg login when the flag is on', async () => {
    render(<WithOneGovSg />)

    expect(
      await screen.findByRole('button', { name: 'Log in with one.gov.sg' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /WOG AD/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/can use Singpass login/)).not.toBeInTheDocument()
  })
})
