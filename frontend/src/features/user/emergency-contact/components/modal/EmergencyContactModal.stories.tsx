import { Meta, Story } from '@storybook/react'

import { authHandlers } from '~/mocks/msw/handlers/auth'

import { EmergencyContactModal } from './EmergencyContactModal'

export default {
  title: 'Features/User/EmergencyContactModal',
  component: EmergencyContactModal,
  decorators: [],
  parameters: {
    layout: 'fullscreen',
    msw: authHandlers,
  },
} as Meta

const Template: Story = () => <EmergencyContactModal />
export const Default = Template.bind({})
