import { Meta, StoryFn } from '@storybook/react'

import { PRIVACY_POLICY_ROUTE } from '~constants/routes'
import { StoryRouter } from '~utils/storybook'

import { PrivacyPolicyPage } from './PrivacyPolicyPage'

export default {
  title: 'Pages/PrivacyPolicyPage',
  component: PrivacyPolicyPage,
  decorators: [
    StoryRouter({
      initialEntries: [PRIVACY_POLICY_ROUTE],
      path: PRIVACY_POLICY_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn = () => <PrivacyPolicyPage />
export const Default = Template.bind({})
Default.storyName = 'PrivacyPolicyPage'
