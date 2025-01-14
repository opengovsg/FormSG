import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'
import { merge } from 'lodash'

import { getByTextContent } from '~/test-utils'

import * as stories from './ParagraphField.stories'

const { Default } = composeStories(stories)

it('renders field successfully (without markdown)', async () => {
  // Arrange
  const expectedDescription = 'Statement description'
  const schema = merge({}, Default.args?.schema, {
    description: expectedDescription,
  })
  render(<Default schema={schema} />)

  // Assert
  expect(screen.getByText(expectedDescription)).toBeInTheDocument()
})

it('renders field successfully (with markdown)', async () => {
  // Arrange
  const expectedDescription = `This is a [link](https://form.gov.sg)`
  const schema = merge({}, Default.args?.schema, {
    description: expectedDescription,
  })
  render(<Default schema={schema} />)

  // Assert
  expect(getByTextContent(screen, 'This is a link')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /link/i })).toBeInTheDocument()
})
