import { Meta, StoryFn } from '@storybook/react'

import { AdminFormDto } from '~shared/types/form'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'
import { getFreeSmsQuota } from '~/mocks/msw/handlers/admin-form/twilio'

import { StoryRouter, viewports } from '~utils/storybook'

import { SettingsTwilioPage } from './SettingsTwilioPage'

const buildMswRoutes = ({
  delay = 0,
  overrides = {},
}: { overrides?: Partial<AdminFormDto>; delay?: number | 'infinite' } = {}) => [
  ...createFormBuilderMocks(overrides, delay),
  getFreeSmsQuota({ delay }),
]

export default {
  title: 'Pages/AdminFormPage/Settings/Twilio',
  component: SettingsTwilioPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: StoryFn = () => <SettingsTwilioPage />
export const WithoutCustomCredentials = Template.bind({})

export const WithCustomCredentials = Template.bind({})
WithCustomCredentials.parameters = {
  msw: buildMswRoutes({
    overrides: { msgSrvcName: 'some-test-twilio-credentials' },
  }),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({ delay: 'infinite' }),
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}
