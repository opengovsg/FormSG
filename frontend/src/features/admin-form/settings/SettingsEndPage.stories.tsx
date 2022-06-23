import { Meta, Story } from '@storybook/react'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'

import {
  getMobileViewParameters,
  getTabletViewParameters,
  StoryRouter,
} from '~utils/storybook'

import { SettingsEndPage } from './SettingsEndPage'

const buildMswRoutes = ({
  delay,
}: {
  delay?: number | 'infinite'
} = {}) => [...createFormBuilderMocks({}, delay)]

export default {
  title: 'Pages/AdminFormPage/Settings/EndPage',
  component: SettingsEndPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes({ delay: 0 }),
  },
} as Meta

const Template: Story = () => <SettingsEndPage />

export const Desktop = Template.bind({})

export const Tablet = Template.bind({})
Tablet.parameters = getTabletViewParameters()

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()
