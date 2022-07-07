import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'
import {
  FormColorTheme,
  FormId,
  FormResponseMode,
  PublicFormDto,
} from '~shared/types/form/form'
import { FormLogoState } from '~shared/types/form/form_logo'

import { MOCK_FORM_FIELDS } from '~/mocks/msw/handlers/admin-form'
import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  BASE_FORM,
  getCustomLogoResponse,
  getPublicFormResponse,
} from '~/mocks/msw/handlers/public-form'

import { getMobileViewParameters } from '~utils/storybook'

import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import { FormSectionsProvider } from '../FormFields/FormSectionsContext'

import {
  MiniHeader as MiniHeaderComponent,
  MiniHeaderProps,
} from './FormHeader'
import { FormStartPage } from './FormStartPage'

export default {
  title: 'Pages/PublicFormPage/FormStartPage',
  component: FormStartPage,
  decorators: [
    (storyFn) => (
      <PublicFormProvider formId="61540ece3d4a6e50ac0cc6ff">
        {storyFn()}
      </PublicFormProvider>
    ),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
  },
} as Meta

const Template: Story = () => <FormStartPage />
export const NoLogo = Template.bind({})
NoLogo.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test title',
        },
      },
      delay: 0,
    }),
  ],
}

export const CustomLogo = Template.bind({})
CustomLogo.parameters = {
  msw: [
    ...envHandlers,
    getCustomLogoResponse(),
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test title',
          startPage: {
            logo: {
              state: FormLogoState.Custom,
              fileId: 'mockFormLogo',
            },
          },
        },
      },
      delay: 0,
    }),
  ],
}

export const NoEstimatedTime = Template.bind({})
NoEstimatedTime.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook no estimated time',
          startPage: {
            estTimeTaken: 0,
          },
        },
      },
      delay: 0,
    }),
  ],
}

export const ColorThemeBrown = Template.bind({})
ColorThemeBrown.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test brown theme',
          startPage: {
            colorTheme: FormColorTheme.Brown,
          },
        },
      },
      delay: 0,
    }),
  ],
}
export const ColorThemeGreen = Template.bind({})
ColorThemeGreen.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test green theme',
          startPage: {
            colorTheme: FormColorTheme.Green,
          },
        },
      },
      delay: 0,
    }),
  ],
}

export const ColorThemeGrey = Template.bind({})
ColorThemeGrey.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test grey theme',
          startPage: {
            colorTheme: FormColorTheme.Grey,
          },
        },
      },
      delay: 0,
    }),
  ],
}

export const ColorThemeOrange = Template.bind({})
ColorThemeOrange.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test orange theme',
          startPage: {
            colorTheme: FormColorTheme.Orange,
          },
        },
      },
      delay: 0,
    }),
  ],
}

export const ColorThemeRed = Template.bind({})
ColorThemeRed.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test red theme',
          startPage: {
            colorTheme: FormColorTheme.Red,
          },
        },
      },
      delay: 0,
    }),
  ],
}
interface MiniHeaderWithFormProps extends MiniHeaderProps {
  form: PublicFormDto
}
const testForm = {
  _id: 'testFormId' as FormId,
  admin: BASE_FORM.admin,
  authType: BASE_FORM.authType,
  endPage: BASE_FORM.endPage,
  form_fields: MOCK_FORM_FIELDS,
  form_logics: BASE_FORM.form_logics,
  hasCaptcha: BASE_FORM.hasCaptcha,
  startPage: BASE_FORM.startPage,
  status: BASE_FORM.status,
  title: BASE_FORM.title,
  responseMode: FormResponseMode.Email,
}

export const MiniHeader: Story<MiniHeaderWithFormProps> = (args) => (
  <FormSectionsProvider {...args}>
    <MiniHeaderComponent {...args} />
  </FormSectionsProvider>
)
MiniHeader.args = {
  isOpen: true,
  form: testForm,
}
MiniHeader.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          title: 'storybook test title',
        },
      },
      delay: 0,
    }),
  ],
}

export const MiniHeaderMobile: Story<MiniHeaderWithFormProps> = (args) => (
  <FormSectionsProvider {...args}>
    <MiniHeaderComponent {...args} />
  </FormSectionsProvider>
)
MiniHeaderMobile.args = {
  ...MiniHeader.args,
}

MiniHeaderMobile.parameters = {
  ...MiniHeader.parameters,
  ...getMobileViewParameters(),
}
