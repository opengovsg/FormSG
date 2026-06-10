import { BiCog } from 'react-icons/bi'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { DrawerTabIcon } from './DrawerTabIcon'

const noop = () => undefined

describe('DrawerTabIcon', () => {
  it('shows the nav label beneath the icon when a navLabel is given', () => {
    render(
      <DrawerTabIcon
        icon={<BiCog />}
        onClick={noop}
        label="Add fields"
        navLabel="Fields"
        isActive={false}
      />,
    )

    expect(screen.getByText('Fields')).toBeInTheDocument()
  })

  it('renders an icon-only button with a hover tooltip when no navLabel is given', async () => {
    render(
      <DrawerTabIcon
        icon={<BiCog />}
        onClick={noop}
        label="Add fields"
        isActive={false}
      />,
    )

    // The label is discoverable via the hover tooltip instead.
    await userEvent.hover(screen.getByRole('button', { name: 'Add fields' }))
    await waitFor(() =>
      expect(screen.getByRole('tooltip')).toHaveTextContent('Add fields'),
    )
  })

  it('does not render a tooltip when a navLabel is shown', async () => {
    render(
      <DrawerTabIcon
        icon={<BiCog />}
        onClick={noop}
        label="Add fields"
        navLabel="Fields"
        isActive={false}
      />,
    )

    await userEvent.hover(screen.getByRole('button', { name: 'Add fields' }))

    // Label is already visible, so no tooltip should ever appear.
    await expect(
      waitFor(() => screen.getByRole('tooltip'), { timeout: 1000 }),
    ).rejects.toThrow()
  })

  it('keeps the descriptive aria-label on the button in both arms', () => {
    const { rerender } = render(
      <DrawerTabIcon
        icon={<BiCog />}
        onClick={noop}
        label="Add fields"
        isActive={false}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Add fields' }),
    ).toBeInTheDocument()

    rerender(
      <DrawerTabIcon
        icon={<BiCog />}
        onClick={noop}
        label="Add fields"
        navLabel="Fields"
        isActive={false}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Add fields' }),
    ).toBeInTheDocument()
  })

  it('anchors the red dot to the icon, not the label, in the treatment arm', () => {
    render(
      <DrawerTabIcon
        icon={<BiCog />}
        onClick={noop}
        label="Add workflow"
        navLabel="Workflow"
        showRedDot
        isActive={false}
      />,
    )

    // Dot shares the icon's wrapper (anchored to its corner)...
    const iconBox = screen.getByTestId('drawer-tab-icon-box')
    expect(
      within(iconBox).getByRole('button', { name: 'Add workflow' }),
    ).toBeInTheDocument()
    expect(within(iconBox).getByTestId('drawer-tab-reddot')).toBeInTheDocument()
    // ...and the wrapper excludes the label, so it can't drift to the column.
    expect(within(iconBox).queryByText('Workflow')).not.toBeInTheDocument()
  })
})
