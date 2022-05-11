import { Meta, Story } from '@storybook/react'

import { getLandingStats } from '~/mocks/msw/handlers/landing'

import { LANDING_ROUTE } from '~constants/routes'
import { StoryRouter } from '~utils/storybook'

import { LandingPage } from './LandingPage'

export default {
  title: 'Pages/LandingPage',
  component: LandingPage,
  decorators: [
    StoryRouter({
      initialEntries: [LANDING_ROUTE],
      path: LANDING_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    msw: [getLandingStats()],
  },
} as Meta

const Template: Story = () => <LandingPage />
export const Default = Template.bind({})

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [getLandingStats({ delay: 'infinite' })],
}
