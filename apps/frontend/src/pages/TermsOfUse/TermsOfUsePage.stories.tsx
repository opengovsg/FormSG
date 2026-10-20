import { Meta, StoryFn } from '@storybook/react-vite'

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
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
  },
} as Meta

const Template: StoryFn = () => <TermsOfUsePage />
export const Default = Template.bind({})
Default.storyName = 'TermsOfUsePage'
