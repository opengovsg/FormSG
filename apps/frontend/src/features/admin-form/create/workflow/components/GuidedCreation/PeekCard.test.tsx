import { fireEvent, render, screen } from '@testing-library/react'

import { PeekCard } from './PeekCard'

describe('PeekCard', () => {
  it('should render the title, and the subtitle only when given one', () => {
    const { rerender } = render(
      <PeekCard
        title="Nice, Step 2 is all set"
        subtitle="Would you like to add another step?"
        actions={[{ label: 'Done', onClick: () => undefined }]}
      />,
    )

    expect(screen.getByText('Nice, Step 2 is all set')).toBeInTheDocument()
    expect(
      screen.getByText('Would you like to add another step?'),
    ).toBeInTheDocument()

    rerender(
      <PeekCard
        title="Nice, Step 2 is all set"
        actions={[{ label: 'Done', onClick: () => undefined }]}
      />,
    )

    expect(screen.getByText('Nice, Step 2 is all set')).toBeInTheDocument()
    expect(
      screen.queryByText('Would you like to add another step?'),
    ).not.toBeInTheDocument()
  })

  // The reason actions is an array rather than one onDone callback: each action
  // carries its own handler, so two of them cannot be collapsed into one.
  it('should give each action its own handler', () => {
    const onDecline = vi.fn()
    const onAccept = vi.fn()

    render(
      <PeekCard
        title="Nice, Step 2 is all set"
        actions={[
          { label: "No, I'm done", onClick: onDecline },
          { label: 'Yes, add a step', onClick: onAccept },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: "No, I'm done" }))
    expect(onDecline).toHaveBeenCalledTimes(1)
    expect(onAccept).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, add a step' }))
    expect(onAccept).toHaveBeenCalledTimes(1)
    expect(onDecline).toHaveBeenCalledTimes(1)
  })

  // Primary last is positional, so the order actions arrive in is the order
  // they render in. Getting this backwards would put the solid button first.
  it('should render actions in the order given, primary last', () => {
    render(
      <PeekCard
        title="Nice, Step 2 is all set"
        actions={[
          { label: "No, I'm done", onClick: () => undefined },
          { label: 'Yes, add a step', onClick: () => undefined },
        ]}
      />,
    )

    expect(
      screen.getAllByRole('button').map((button) => button.textContent),
    ).toEqual(["No, I'm done", 'Yes, add a step'])
  })
})
