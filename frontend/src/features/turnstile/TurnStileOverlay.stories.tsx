import { QueryClient, QueryClientProvider } from 'react-query'
import { Meta, StoryObj } from '@storybook/react'
import { rest } from 'msw'

import TurnstileOverlay from './TurnstileOverlay'

const queryClient = new QueryClient()

const DUMMY_INTERACTIVE_TURNSTILE_SITE_KEY = '3x00000000000000000000FF'

const meta = {
  title: 'Features/TurnstileOverlay',
  component: TurnstileOverlay,
  decorators: [
    (Story) => (
      // @ts-expect-error missing FC type in old version
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: [
      rest.get('/api/v3/client/env', (_req, res, ctx) => {
        return res(
          ctx.status(200),
          ctx.json({
            turnstileSiteKey: DUMMY_INTERACTIVE_TURNSTILE_SITE_KEY,
          }),
        )
      }),
    ],
  },
} satisfies Meta<typeof TurnstileOverlay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isOpen: true,
    onSuccess: () => console.log('Success'),
    onError: () => console.log('Error'),
    onClose: () => console.log('Close'),
    onLoadingError: () => console.log('Loading Error'),
  },
}

export const SmallMobile: Story = {
  args: {
    isOpen: true,
    onSuccess: () => console.log('Success'),
    onError: () => console.log('Error'),
    onClose: () => console.log('Close'),
    onLoadingError: () => console.log('Loading Error'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
