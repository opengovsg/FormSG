import { Meta, StoryObj } from '@storybook/react'

import TurnstileOverlay from './TurnstileOverlay'

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
    onSuccess: () => console.log('Success'),
    onError: () => console.log('Error'),
    onClose: () => console.log('Close'),
    onLoadingError: () => console.log('Loading Error'),
    turnstileScriptId: 'turnstile-script-id',
  },
}

export const SmallMobile: Story = {
  args: {
    onSuccess: () => console.log('Success'),
    onError: () => console.log('Error'),
    onClose: () => console.log('Close'),
    onLoadingError: () => console.log('Loading Error'),
    turnstileScriptId: 'turnstile-script-id',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}
