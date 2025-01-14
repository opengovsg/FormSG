import { Meta, StoryFn } from '@storybook/react'

import { TOU_ROUTE } from '~constants/routes'
import { StoryRouter } from '~utils/storybook'

import { TermsOfUsePage } from './TermsOfUsePage'

export default {
  title: 'Pages/TermsOfUsePage',
  component: TermsOfUsePage,
  decorators: [
    StoryRouter({
      initialEntries: [TOU_ROUTE],
      path: TOU_ROUTE,
    }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const Template: StoryFn = () => <TermsOfUsePage />
export const Default = Template.bind({})
Default.storyName = 'TermsOfUsePage'
