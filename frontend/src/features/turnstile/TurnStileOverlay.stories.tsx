import { Meta, StoryObj } from '@storybook/react'

import TurnstileOverlay from './TurnstileOverlay'

const DUMMY_INTERACTIVE_TURNSTILE_SITE_KEY = '3x00000000000000000000FF'

const meta = {
  title: 'Features/TurnstileOverlay',
  component: TurnstileOverlay,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TurnstileOverlay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    turnstileSiteKey: DUMMY_INTERACTIVE_TURNSTILE_SITE_KEY,
    isOpen: true,
    onSuccess: () => console.log('Success'),
    onError: () => console.log('Error'),
    onClose: () => console.log('Close'),
    onLoadingError: () => console.log('Loading Error'),
  },
}

export const SmallMobile: Story = {
  args: {
    turnstileSiteKey: DUMMY_INTERACTIVE_TURNSTILE_SITE_KEY,
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
