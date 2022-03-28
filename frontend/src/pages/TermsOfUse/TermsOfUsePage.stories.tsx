import { Meta, Story } from '@storybook/react'

import { TermsOfUsePage } from './TermsOfUsePage'

export default {
  title: 'Pages/TermsOfUsePage',
  component: TermsOfUsePage,
  decorators: [],
} as Meta

const Template: Story = () => <TermsOfUsePage />
export const Default = Template.bind({})
