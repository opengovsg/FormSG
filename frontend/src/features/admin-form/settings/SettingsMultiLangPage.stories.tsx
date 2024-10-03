import { Meta, Story } from '@storybook/react'

import { FormSettings, Language } from '~shared/types'

import {
  getAdminFormSettings,
  patchAdminFormSettings,
} from '~/mocks/msw/handlers/admin-form'

import {
  getMobileViewParameters,
  StoryRouter,
  viewports,
} from '~utils/storybook'

import { SettingsMultiLangPage } from './SettingsMultiLangPage'

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
  title: 'Pages/AdminFormPage/Settings/MultiLang',
  component: SettingsMultiLangPage,
  decorators: [StoryRouter({ initialEntries: ['/12345'], path: '/:formId' })],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <SettingsMultiLangPage />
export const MultiLangNotSelected = Template.bind({})
MultiLangNotSelected.parameters = {
  msw: buildMswRoutes({
    overrides: { hasMultiLang: false },
  }),
}

export const MultiLangAllLanguagesSelected = Template.bind({})
MultiLangAllLanguagesSelected.parameters = {
  msw: buildMswRoutes({
    overrides: { hasMultiLang: true },
  }),
}

export const MultiLangEnglishChineseMalaySelected = Template.bind({})
MultiLangEnglishChineseMalaySelected.parameters = {
  msw: buildMswRoutes({
    overrides: {
      hasMultiLang: true,
      supportedLanguages: [Language.ENGLISH, Language.CHINESE, Language.MALAY],
    },
  }),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: buildMswRoutes({ delay: 'infinite' }),
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  ...getMobileViewParameters(),
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}
