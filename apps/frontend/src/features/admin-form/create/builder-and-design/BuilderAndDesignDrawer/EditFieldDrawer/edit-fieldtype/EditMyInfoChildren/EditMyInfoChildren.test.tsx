import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'

import * as stories from './EditMyInfoChildren.stories'

const { Default } = composeStories(stories)

describe('EditMyInfoChildren', () => {
  it('does not offer the allow-multiple toggle', async () => {
    render(<Default />)

    await screen.findByText('Collect the following child data')

    expect(
      screen.queryByText(/allow respondent to add multiple children/i),
    ).toBeNull()
  })
})
