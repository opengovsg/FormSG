import { Meta, Story } from '@storybook/react'

import { PrivacyPolicyPage } from './PrivacyPolicyPage'

export default {
  title: 'Pages/PrivacyPolicyPage',
  component: PrivacyPolicyPage,
  decorators: [],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: Story = () => <PrivacyPolicyPage />
export const Default = Template.bind({})
Default.storyName = 'PrivacyPolicyPage'
