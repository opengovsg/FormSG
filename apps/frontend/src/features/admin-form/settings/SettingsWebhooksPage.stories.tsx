import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Decorator, Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

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
    chromatic: { pauseAnimationAtEnd: true, delay: 300 },
    msw: { handlers: { default: buildMswRoutes() } },
  },
} as Meta

const Template: StoryFn = () => <SettingsWebhooksPage />
export const StorageModeEmpty = Template.bind({})
StorageModeEmpty.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Encrypt,
        },
      }),
    },
  },
}

const withGrowthBookFeatures = (
  features: Record<string, boolean>,
): Decorator => {
  const growthbook = new GrowthBook({
    features: Object.fromEntries(
      Object.entries(features).map(([flag, on]) => [
        flag,
        { defaultValue: on },
      ]),
    ),
  })
  return (Story) => (
    <GrowthBookProvider growthbook={growthbook}>
      <Story />
    </GrowthBookProvider>
  )
}

export const StorageModeMrfCutoverOn = Template.bind({})
StorageModeMrfCutoverOn.decorators = [
  withGrowthBookFeatures({ [featureFlags.mrfCutover]: true }),
]
StorageModeMrfCutoverOn.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Encrypt,
        },
      }),
    },
  },
}

export const StorageModeRetryEnabled = Template.bind({})
StorageModeRetryEnabled.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Encrypt,
          webhook: {
            url: 'https://example.com/webhook',
            isRetryEnabled: true,
          },
        },
      }),
    },
  },
}

export const MrfMode = Template.bind({})
MrfMode.decorators = [
  withGrowthBookFeatures({ [featureFlags.enableMrfWebhooks]: true }),
]
MrfMode.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Multirespondent,
        },
      }),
    },
  },
}

export const MrfModeMrfCutoverOn = Template.bind({})
MrfModeMrfCutoverOn.decorators = [
  withGrowthBookFeatures({
    [featureFlags.enableMrfWebhooks]: true,
    [featureFlags.mrfCutover]: true,
  }),
]
MrfModeMrfCutoverOn.parameters = MrfMode.parameters

export const UnsupportedEmailMode = Template.bind({})

export const UnsupportedMultirespondentMode = Template.bind({})
UnsupportedMultirespondentMode.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Multirespondent,
        },
      }),
    },
  },
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: { handlers: { default: buildMswRoutes({ delay: 'infinite' }) } },
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
