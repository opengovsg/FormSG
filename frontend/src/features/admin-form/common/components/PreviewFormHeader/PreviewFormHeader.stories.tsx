import { Meta, Story } from '@storybook/react'

import { ADMINFORM_BUILD_SUBROUTE } from '~constants/routes'
import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

import { PreviewFormHeader as PreviewFormHeaderComponent } from './PreviewFormHeader'

export default {
  title: 'Features/AdminForm/PreviewFormHeader',
  parameters: {
    layout: 'fullscreen',
  },
  component: PreviewFormHeaderComponent,
  decorators: [
    StoryRouter({
      initialEntries: [ADMINFORM_BUILD_SUBROUTE],
      path: ADMINFORM_BUILD_SUBROUTE,
    }),
  ],
} as Meta

const Template: Story = () => <PreviewFormHeaderComponent />

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const Desktop = Template.bind({})
