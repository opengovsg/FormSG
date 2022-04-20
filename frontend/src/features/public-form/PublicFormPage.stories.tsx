import { Meta, Story } from '@storybook/react'

import { BasicField } from '~shared/types/field'
import { FormAuthType, FormColorTheme } from '~shared/types/form'

import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  getPublicFormResponse,
  postGenerateVfnOtpResponse,
  postVerifyVfnOtpResponse,
  postVfnTransactionResponse,
  SHOW_FIELDS_ON_YES_LOGIC,
} from '~/mocks/msw/handlers/public-form'

import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

import PublicFormPage from './PublicFormPage'

const DEFAULT_MSW_HANDLERS = [
  ...envHandlers,
  getPublicFormResponse(),
  postVfnTransactionResponse(),
  postGenerateVfnOtpResponse(),
  postVerifyVfnOtpResponse(),
]

const generateMswHandlersForColorTheme = (colorTheme: FormColorTheme) => {
  return [
    ...envHandlers,
    getPublicFormResponse({
      overrides: {
        form: {
          startPage: {
            colorTheme,
          },
        },
      },
    }),
    postVfnTransactionResponse(),
    postGenerateVfnOtpResponse(),
    postVerifyVfnOtpResponse(),
  ]
}

export default {
  title: 'Pages/PublicFormPage',
  component: PublicFormPage,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff'],
      path: '/:formId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: Story = () => <PublicFormPage />
export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const ColorThemeGreen = Template.bind({})
ColorThemeGreen.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Green),
}

export const ColorThemeGrey = Template.bind({})
ColorThemeGrey.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Grey),
}

export const ColorThemeBrown = Template.bind({})
ColorThemeBrown.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Brown),
}

export const ColorThemeRed = Template.bind({})
ColorThemeRed.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Red),
}

export const ColorThemeOrange = Template.bind({})
ColorThemeOrange.parameters = {
  msw: generateMswHandlersForColorTheme(FormColorTheme.Orange),
}

export const Loading = Template.bind({})
Loading.parameters = {
  msw: [...envHandlers, getPublicFormResponse({ delay: 'infinite' })],
}

export const SingpassUnauthorized = Template.bind({})
SingpassUnauthorized.storyName = 'Singpass/Unauthorized'
SingpassUnauthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Singpass login form',
          authType: FormAuthType.SP,
        },
      },
    }),
  ],
}

export const UnauthedMobile = Template.bind({})
UnauthedMobile.parameters = {
  ...SingpassUnauthorized.parameters,
  ...getMobileViewParameters(),
}

export const SingpassAuthorized = Template.bind({})
SingpassAuthorized.storyName = 'Singpass/Authorized'
SingpassAuthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Singpass login form',
          authType: FormAuthType.SP,
        },
        spcpSession: {
          userName: 'S1234567A',
        },
      },
    }),
  ],
}

export const CorppassUnauthorized = Template.bind({})
CorppassUnauthorized.storyName = 'Corppass/Unauthorized'
CorppassUnauthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Corppass login form',
          authType: FormAuthType.CP,
        },
      },
    }),
  ],
}

export const CorppassAuthorized = Template.bind({})
CorppassAuthorized.storyName = 'Corppass/Authorized'
CorppassAuthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'Corppass login form',
          authType: FormAuthType.CP,
        },
        spcpSession: {
          userName: '200000000A',
        },
      },
    }),
  ],
}

export const SgidUnauthorized = Template.bind({})
SgidUnauthorized.storyName = 'SGID/Unauthorized'
SgidUnauthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
        },
      },
    }),
  ],
}

export const SgidAuthorized = Template.bind({})
SgidAuthorized.storyName = 'SGID/Authorized'
SgidAuthorized.parameters = {
  msw: [
    ...envHandlers,
    getPublicFormResponse({
      delay: 0,
      overrides: {
        form: {
          title: 'SGID login form',
          authType: FormAuthType.SGID,
        },
        spcpSession: {
          userName: 'S0000000Z',
        },
      },
    }),
  ],
}

export const VerifiedFieldsExpiry = Template.bind({})
VerifiedFieldsExpiry.parameters = {
  msw: [
    postVfnTransactionResponse({
      expiryMsOverride: 3 * 1000,
    }),
    getPublicFormResponse({
      overrides: {
        form: {
          form_fields: [
            {
              allowIntlNumbers: true,
              isVerifiable: true,
              title: 'Verifiable Mobile Number',
              description:
                'Verify with random number and OTP. The field should reset after 3 seconds.',
              required: true,
              disabled: false,
              fieldType: BasicField.Mobile,
              _id: 'some-random-id',
              globalId: 'not-used',
            },
          ],
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const WithLogic = Template.bind({})
WithLogic.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          form_fields: [
            {
              title: '',
              description:
                'Select "Yes" on the field below to show more fields',
              required: true,
              disabled: false,
              fieldType: BasicField.Statement,
              _id: 'some-random-id',
              globalId: 'not-used',
            },
          ],
          form_logics: [SHOW_FIELDS_ON_YES_LOGIC],
        },
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
