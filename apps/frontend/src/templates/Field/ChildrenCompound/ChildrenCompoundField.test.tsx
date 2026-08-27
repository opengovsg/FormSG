import { composeStories } from '@storybook/react'
import { render, screen } from '@testing-library/react'

import * as stories from './ChildrenCompoundField.stories'

const { SingleChild, LegacyAllowMultipleFlag, LegacySecondaryRaceSubField } =
  composeStories(stories)

describe('one child per field', () => {
  // allowMultiple survives on existing form documents, so it must no longer
  // offer a second child.
  it('does not offer to add another child even when the legacy allowMultiple flag is set', () => {
    render(<LegacyAllowMultipleFlag />)

    expect(
      screen.queryByRole('button', { name: /add another child/i }),
    ).toBeNull()
  })

  it('does not offer to remove the single child', () => {
    render(<SingleChild />)

    expect(screen.queryByRole('button', { name: /remove child/i })).toBeNull()
  })
})

// Secondary Race is removed builder-forward only, so existing forms that still
// collect it must keep rendering it.
describe('legacy secondary race sub-field', () => {
  it('still renders for an existing form that collects it', () => {
    render(<LegacySecondaryRaceSubField />)

    expect(screen.getByText('Secondary race')).toBeInTheDocument()
  })
})
