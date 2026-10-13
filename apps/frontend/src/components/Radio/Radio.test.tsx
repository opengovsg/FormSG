import { composeStories } from '@storybook/react'
import { fireEvent, render, screen } from '@testing-library/react'

import * as stories from './Radio.stories'

const { Default } = composeStories(stories)

describe('Radio', () => {
  it('preserves a consumer click handler when selecting the control', () => {
    const onClick = vi.fn()
    render(<Default onClick={onClick} />)
    const radio = screen.getByRole('radio')
    /* eslint-disable testing-library/no-node-access -- the visual circle is aria-hidden, so it cannot be queried by role */
    const control = radio.parentElement?.querySelector('.chakra-radio__control')
    /* eslint-enable testing-library/no-node-access */

    expect(control).toBeInTheDocument()

    fireEvent.click(control as Element)

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(radio).toBeChecked()
  })
})
