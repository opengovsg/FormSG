import { Meta, Story } from '@storybook/react'

import {
  FormColorTheme,
  FormLogoState,
  FormSettings,
  Language,
} from '~shared/types'

import {
  createFormBuilderMocks,
  getAdminFormSettings,
  MOCK_FORM_FIELDS_WITH_NO_TRANSLATIONS,
  MOCK_FORM_FIELDS_WITH_TRANSLATIONS,
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
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <SettingsMultiLangPage />

// Stories related to toggling multi language translation feature on and off
// and choosing which language to enable translations for
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

// Stories related to displaying list of form fields for translations
export const MultiLangListOfFormFieldsWithNoTranslations = Template.bind({})
MultiLangListOfFormFieldsWithNoTranslations.parameters = {
  router: {
    initialEntries: ['/61540ece3d4a6e50ac0cc6ff/settings/multi-language/zh-SG'],
    path: '/:formId/settings/multi-language/:language',
  },
  msw: [
    ...createFormBuilderMocks({
      form_fields: MOCK_FORM_FIELDS_WITH_NO_TRANSLATIONS,
      startPage: {
        colorTheme: FormColorTheme.Blue,
        logo: { state: FormLogoState.Default },
        paragraph: 'Test start page',
      },
    }),
    getAdminFormSettings(),
    patchAdminFormSettings(),
  ],
}

export const MultiLangListOfFormFieldsWithCompletedTranslations = Template.bind(
  {},
)
MultiLangListOfFormFieldsWithCompletedTranslations.parameters = {
  router: {
    initialEntries: ['/61540ece3d4a6e50ac0cc6ff/settings/multi-language/zh-SG'],
    path: '/:formId/settings/multi-language/:language',
  },
  msw: [
    ...createFormBuilderMocks({
      form_fields: MOCK_FORM_FIELDS_WITH_TRANSLATIONS,
      // Completed translations for start page
      startPage: {
        colorTheme: FormColorTheme.Blue,
        logo: { state: FormLogoState.Default },
        paragraph: 'Test start page',
        paragraphTranslations: [
          { language: Language.CHINESE, translation: 'Fake Translations' },
        ],
      },
      // Completed translations for end page
      endPage: {
        title: 'Thank you for filling out the form.',
        titleTranslations: [
          { language: Language.CHINESE, translation: 'Fake Title Translation' },
        ],
        paragraph: 'Test end page paragraph',
        paragraphTranslations: [
          {
            language: Language.CHINESE,
            translation: 'Fake Paragraph Translation',
          },
        ],
        buttonText: 'Submit another form',
        paymentTitle: 'payment title',
        paymentParagraph: 'payment paragraph',
      },
    }),
    getAdminFormSettings(),
    patchAdminFormSettings(),
  ],
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
