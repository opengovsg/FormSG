import { Meta, StoryFn } from '@storybook/react'

import { FormResponseMode, FormSettings } from '~shared/types/form'

import {
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import {
  getMobileViewParameters,
  StoryRouter,
  viewports,
} from '~utils/storybook'

import { SettingsWebhooksPage } from './SettingsWebhooksPage'

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
  title: 'Pages/AdminFormPage/Settings/Webhooks',
  component: SettingsWebhooksPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: StoryFn = () => <SettingsWebhooksPage />
export const StorageModeEmpty = Template.bind({})
StorageModeEmpty.parameters = {
  msw: buildMswRoutes({
    overrides: {
      responseMode: FormResponseMode.Encrypt,
    },
  }),
}

export const StorageModeRetryEnabled = Template.bind({})
StorageModeRetryEnabled.parameters = {
  msw: buildMswRoutes({
    overrides: {
      responseMode: FormResponseMode.Encrypt,
      webhook: {
        url: 'https://example.com/webhook',
        isRetryEnabled: true,
      },
    },
  }),
}

export const UnsupportedEmailMode = Template.bind({})

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({ delay: 'infinite' }),
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  ...StorageModeRetryEnabled.parameters,
  ...getMobileViewParameters(),
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  ...StorageModeRetryEnabled.parameters,
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}
