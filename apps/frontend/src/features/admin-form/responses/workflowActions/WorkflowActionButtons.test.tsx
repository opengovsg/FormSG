import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { render } from '~/test-utils'

import { WorkflowActionButtons } from './WorkflowActionButtons'

it('shows the action explanation on keyboard focus and invokes the shared handler once', async () => {
  const onClick = vi.fn()
  render(
    <WorkflowActionButtons
      actions={[
        {
          id: 'sendBack',
          label: 'Send back',
          tooltip: 'Ask someone at an earlier step to make changes.',
          disabled: false,
          loading: false,
          onClick,
        },
      ]}
    />,
  )
  await userEvent.tab()
  await waitFor(() =>
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'Ask someone at an earlier step to make changes.',
    ),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Send back' }))
  expect(onClick).toHaveBeenCalledTimes(1)
})
