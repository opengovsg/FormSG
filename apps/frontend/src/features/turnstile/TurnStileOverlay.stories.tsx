import { Meta, StoryObj } from '@storybook/react-vite'

import { viewportModes } from '~utils/storybook'

import TurnstileOverlay from './TurnstileOverlay'

const DUMMY_INTERACTIVE_TURNSTILE_SITE_KEY = '3x00000000000000000000FF'

const meta = {
  title: 'Features/TurnstileOverlay',
  component: TurnstileOverlay,
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
} satisfies Meta<typeof TurnstileOverlay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: { argos: { modes: viewportModes('mobile') } },
  args: {
    turnstileSiteKey: DUMMY_INTERACTIVE_TURNSTILE_SITE_KEY,
    isOpen: true,
    onSuccess: () => console.log('Success'),
    onError: () => console.log('Error'),
    onClose: () => console.log('Close'),
    onLoadingError: () => console.log('Loading Error'),
  },
}
