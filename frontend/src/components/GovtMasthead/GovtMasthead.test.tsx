import { composeStories } from '@storybook/testing-react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as stories from './GovtMasthead.stories'

const { GovtMasthead } = composeStories(stories)

it('expands and collapses content on desktop after clicking on "how to identify"', async () => {
  // Arrange
  await act(async () => {
    render(<GovtMasthead />)
  })
  const howToIdentifyLink = screen.getByRole('link', {
    name: /how to identify/i,
  })

  expect(screen.getByText(/trusted websites/i)).not.toBeVisible()

  // Act
  await act(async () => userEvent.click(howToIdentifyLink))

  // Assert
  // Should expand content.
  // Use waitFor and queryByText (instead of just getByText) so that it doesn't throw on
  // the first attempt of not finding the text
  await waitFor(() => {
    expect(screen.queryByText(/trusted websites/i)).toBeVisible()
  })

  // Act again
  await act(async () => userEvent.click(howToIdentifyLink))

  // Assert again
  // Should collapse content.
  // Use waitFor because the collapse animation must be completed
  // for the content to be considered not visible
  await waitFor(() => {
    expect(screen.queryByText(/trusted websites/i)).not.toBeVisible()
  })
})

it('renders an external link to "https://go.gov.sg/trusted-sites" when expanded', async () => {
  // Arrange
  await act(async () => {
    render(<GovtMasthead />)
  })
  const howToIdentifyLink = screen.getByRole('link', {
    name: /how to identify/i,
  })

  expect(screen.getByText(/trusted websites/i)).not.toBeVisible()

  // Act
  await act(async () => userEvent.click(howToIdentifyLink))

  // Assert
  // Should render an external link
  await waitFor(() => {
    expect(
      screen.getByRole('link', {
        name: /trusted websites/i,
      }),
    ).toBeVisible()
  })
})
