import { composeStories } from '@storybook/testing-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import * as stories from './GovtMasthead.stories'

const { GovtMastheadExpanded, GovtMastheadCollapsed } = composeStories(stories)

it('should collapse if it is in expanded state', async () => {
  // Arrange
  render(<GovtMastheadExpanded />)

  // Act
  const howToIdentifyLink = screen.getByText(/how to identify/i)
  userEvent.click(howToIdentifyLink)

  // Assert
  expect(
    screen.queryByTestId('govtMastheadExpandedContent'),
  ).not.toBeInTheDocument()
})

it('should expand if it is in expanded state', async () => {
  // Arrange
  render(<GovtMastheadCollapsed />)

  // Act
  const howToIdentifyLink = screen.getByText(/how to identify/i)
  userEvent.click(howToIdentifyLink)

  // Assert
  expect(screen.getByTestId('govtMastheadExpandedContent')).toBeInTheDocument()
})
