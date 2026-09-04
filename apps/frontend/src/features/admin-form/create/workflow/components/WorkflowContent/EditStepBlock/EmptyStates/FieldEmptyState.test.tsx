import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { FieldEmptyState } from './FieldEmptyState'

const addAction = vi.fn()

beforeEach(() => {
  addAction.mockClear()
  // @ts-expect-error partial DD_RUM mock
  window.DD_RUM = {
    addAction,
    onReady: (cb: () => void) => cb(),
  }
})

afterEach(() => {
  window.DD_RUM = undefined
})

const renderEmptyState = (onAction = () => undefined) =>
  render(
    <FieldEmptyState
      picker="yesno"
      message="Your form has no Yes/No field yet."
      actionLabel="Add a Yes/No field"
      onAction={onAction}
    />,
  )

describe('FieldEmptyState', () => {
  it('shows the message and the action', () => {
    renderEmptyState()

    expect(
      screen.getByText('Your form has no Yes/No field yet.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Add a Yes/No field' }),
    ).toBeInTheDocument()
  })

  it('calls onAction when the button is clicked', async () => {
    const onAction = vi.fn()
    renderEmptyState(onAction)

    await userEvent.click(
      screen.getByRole('button', { name: 'Add a Yes/No field' }),
    )

    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('reports which picker was empty, once per mount', async () => {
    renderEmptyState()

    await waitFor(() =>
      expect(addAction).toHaveBeenCalledWith(
        'workflow_builder.empty_state.shown',
        { picker: 'yesno' },
      ),
    )
    expect(addAction).toHaveBeenCalledTimes(1)
  })
})
