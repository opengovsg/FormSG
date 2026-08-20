import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { Meta, StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'
import { DateString } from 'formsg-shared/types'
import { FormResponseMode, FormSettings } from 'formsg-shared/types/form'

import {
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

import { SettingsGeneralPage } from './SettingsGeneralPage'

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

const scheduledClosureOn = new GrowthBook({
  features: { [featureFlags.scheduledFormClosure]: { defaultValue: true } },
})

export default {
  title: 'Pages/AdminFormPage/Settings/General',
  component: SettingsGeneralPage,
  decorators: [
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
    (Story) => (
      <GrowthBookProvider growthbook={scheduledClosureOn}>
        <Story />
      </GrowthBookProvider>
    ),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true, delay: 300 },
    msw: {
      handlers: {
        default: buildMswRoutes({
          overrides: { responseMode: FormResponseMode.Encrypt },
        }),
      },
    },
  },
} as Meta

const Template: StoryFn = () => <SettingsGeneralPage />

/** Expiry toggle off — the date picker is hidden until the admin opts in. */
export const NoScheduledClosure = Template.bind({})

/** Expiry toggle on, showing the date picker pre-filled with a close date. */
export const WithScheduledClosure = Template.bind({})
WithScheduledClosure.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Encrypt,
          closeAt: '2026-12-31T15:59:59.999Z' as DateString,
        },
      }),
    },
  },
}

/** Both auto-close triggers set, to check they read as independent. */
export const WithResponseLimitAndScheduledClosure = Template.bind({})
WithResponseLimitAndScheduledClosure.parameters = {
  msw: {
    handlers: {
      default: buildMswRoutes({
        overrides: {
          responseMode: FormResponseMode.Encrypt,
          submissionLimit: 1000,
          closeAt: '2026-12-31T15:59:59.999Z' as DateString,
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
  ...WithScheduledClosure.parameters,
  ...getMobileViewParameters(),
}
