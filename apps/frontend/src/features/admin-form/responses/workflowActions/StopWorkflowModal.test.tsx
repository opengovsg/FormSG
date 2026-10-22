import { composeStories } from '@storybook/react-vite'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'

import * as stories from './StopWorkflowModal.stories'

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({
    data = [],
    itemContent,
  }: {
    data?: unknown[]
    itemContent: (index: number, item: unknown) => React.ReactNode
  }) => <>{data.map((item, index) => itemContent(index, item))}</>,
}))

const { NoEmailFields } = composeStories(stories)

const ADD_EMAIL_FIELD = { name: /add an email field/i }

const openEmailFieldSelect = async () => {
  const [select] = await screen.findAllByRole(
    'combobox',
    {},
    { timeout: 10000 },
  )
  await waitFor(() => expect(select).toBeEnabled())
  await act(async () => {
    fireEvent.click(select)
  })
}

describe('StopWorkflowModal Email field select', () => {
  it('offers to add an Email field when the form has none', async () => {
    await NoEmailFields.run()
    await openEmailFieldSelect()

    expect(
      await screen.findByRole('option', ADD_EMAIL_FIELD),
    ).toBeInTheDocument()
  }, 20000)
})
