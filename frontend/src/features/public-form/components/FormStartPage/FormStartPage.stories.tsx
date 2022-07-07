import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types'
import {
  FormAuthType,
  FormColorTheme,
  FormId,
  FormResponseMode,
  FormStatus,
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

const formWithSections: PublicFormDto = {
  _id: 'testFormId' as FormId,
  admin: BASE_FORM.admin,
  authType: FormAuthType.NIL,
  endPage: BASE_FORM.endPage,
  form_logics: BASE_FORM.form_logics,
  hasCaptcha: BASE_FORM.hasCaptcha,
  startPage: {
    colorTheme: FormColorTheme.Blue,
    logo: { state: FormLogoState.Default },
  },
  status: FormStatus.Public,
  title: BASE_FORM.title,
  responseMode: FormResponseMode.Email as const,
  form_fields: MOCK_FORM_FIELDS,
}

const formWithoutSections: PublicFormDto = {
  _id: 'testFormId' as FormId,
  admin: BASE_FORM.admin,
  authType: FormAuthType.NIL,
  endPage: BASE_FORM.endPage,
  form_logics: BASE_FORM.form_logics,
  hasCaptcha: BASE_FORM.hasCaptcha,
  startPage: {
    colorTheme: FormColorTheme.Blue,
    logo: { state: FormLogoState.Default },
  },
  status: FormStatus.Public,
  title: BASE_FORM.title,
  responseMode: FormResponseMode.Email as const,
  form_fields: [
    {
      title: 'Yes/No',
      description: '',
      required: true,
      disabled: false,
      fieldType: BasicField.YesNo,
      _id: '5da04eb5e397fc0013f63c7e',
      globalId: 'CnGRpTpnqSrISnk28yLDvKt8MI2HCFJuYbk72ie0l56',
    },
  ],
}

export const MiniHeader: Story<MiniHeaderWithFormProps> = (args) => (
  <FormSectionsProvider {...args}>
    <MiniHeaderComponent {...args} />
  </FormSectionsProvider>
)
MiniHeader.args = {
  isOpen: true,
  form: formWithSections,
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

export const MiniHeaderMobileWithSections: Story<MiniHeaderWithFormProps> = (
  args,
) => (
  <FormSectionsProvider {...args}>
    <MiniHeaderComponent {...args} />
  </FormSectionsProvider>
)
MiniHeaderMobileWithSections.args = {
  ...MiniHeader.args,
}

MiniHeaderMobileWithSections.parameters = {
  ...MiniHeader.parameters,
  ...getMobileViewParameters(),
}

export const MiniHeaderMobileWithoutSections: Story<MiniHeaderWithFormProps> = (
  args,
) => (
  <FormSectionsProvider {...args}>
    <MiniHeaderComponent {...args} />
  </FormSectionsProvider>
)
MiniHeaderMobileWithoutSections.args = {
  isOpen: true,
  form: formWithoutSections,
}

MiniHeaderMobileWithoutSections.parameters = {
  ...MiniHeader.parameters,
  ...getMobileViewParameters(),
}
