import { Meta, Story } from '@storybook/react'

import { FormSettings } from '~shared/types'

import {
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter, viewports } from '~utils/storybook'

import { SettingsEndPage } from './SettingsEndPage'

const buildMswRoutes = ({
  overrides,
  delay,
}: {
  overrides?: Partial<FormSettings>
  delay?: number | 'infinite'
} = {}) => [
  getAdminFormSettings({ overrides, delay }),
  patchAdminFormSettings({ overrides }),
]

export default {
  title: 'Pages/AdminFormPage/Settings/EndPage',
  component: SettingsEndPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <SettingsEndPage />

export const Desktop = Template.bind({})

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
