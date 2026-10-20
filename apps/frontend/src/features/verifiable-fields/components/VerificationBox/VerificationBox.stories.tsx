import { MemoryRouter } from 'react-router-dom'
import { Meta, StoryFn } from '@storybook/react-vite'

import { BasicField } from 'formsg-shared/types/field'
import { FormColorTheme } from 'formsg-shared/types/form/form'

import { getPublicFormResponse } from '~/mocks/msw/handlers/public-form'

import { viewportModes } from '~utils/storybook'

import { PublicFormProvider } from '~features/public-form/PublicFormProvider'

import { VerificationBox, VerificationBoxProps } from './VerificationBox'

export default {
  title: 'Features/VerifiableField/VerificationBox',
  component: VerificationBox,

  decorators: [
    (storyFn) => (
      <MemoryRouter initialEntries={['/12345']}>
        <PublicFormProvider
          formId="61540ece3d4a6e50ac0cc6ff"
          startTime={Date.now()}
        >
          {storyFn()}
        </PublicFormProvider>
      </MemoryRouter>
    ),
  ],

  args: {
    handleResendOtp: () => Promise.resolve(console.log('resending otp')),
    handleVfnSuccess: () => Promise.resolve(console.log('vfn success')),
    handleVerifyOtp: () => Promise.resolve('some-mock-signature'),
  },

  parameters: {
    msw: [getPublicFormResponse()],
  },

  globals: {
    viewport: {
      value: 'desktop1',
      isRotated: false,
    },
  },
} as Meta<VerificationBoxProps>

const Template: StoryFn<VerificationBoxProps> = (args) => (
  <VerificationBox {...args} />
)
export const MobileVerificationBox = Template.bind({})
MobileVerificationBox.parameters = { argos: { modes: viewportModes('mobile') } }
MobileVerificationBox.args = {
  fieldType: BasicField.Mobile,
}

export const MobileVerificationBoxOrangeThemeMobile = Template.bind({})
MobileVerificationBoxOrangeThemeMobile.args = {
  fieldType: BasicField.Mobile,
}
MobileVerificationBoxOrangeThemeMobile.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          startPage: {
            colorTheme: FormColorTheme.Orange,
          },
        },
      },
    }),
  ],
}
MobileVerificationBoxOrangeThemeMobile.globals = {
  viewport: { value: 'mobile1', isRotated: false },
}

export const EmailVerificationBox = Template.bind({})
EmailVerificationBox.parameters = { argos: { modes: viewportModes('mobile') } }
EmailVerificationBox.args = {
  fieldType: BasicField.Email,
}

export const EmailVerificationBoxGreenTheme = Template.bind({})
EmailVerificationBoxGreenTheme.args = {
  fieldType: BasicField.Email,
}
EmailVerificationBoxGreenTheme.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          startPage: {
            colorTheme: FormColorTheme.Green,
          },
        },
      },
    }),
  ],
}
