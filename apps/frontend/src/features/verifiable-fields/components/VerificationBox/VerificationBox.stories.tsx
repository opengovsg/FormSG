import { MemoryRouter } from 'react-router-dom'
import { Meta, StoryFn } from '@storybook/react'

import { BasicField } from 'formsg-shared/types/field'
import { FormColorTheme } from 'formsg-shared/types/form/form'

import { getPublicFormResponse } from '~/mocks/msw/handlers/public-form'

import { viewports } from '~utils/storybook'

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
    viewport: {
      defaultViewport: 'desktop1',
    },
  },
} as Meta<VerificationBoxProps>

const Template: StoryFn<VerificationBoxProps> = (args) => (
  <VerificationBox {...args} />
)
export const MobileVerificationBox = Template.bind({})
MobileVerificationBox.args = {
  fieldType: BasicField.Mobile,
}

export const MobileVerificationBoxMobile = Template.bind({})
MobileVerificationBoxMobile.args = {
  fieldType: BasicField.Mobile,
}
MobileVerificationBoxMobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const MobileVerificationBoxOrangeThemeMobile = Template.bind({})
MobileVerificationBoxOrangeThemeMobile.args = {
  fieldType: BasicField.Mobile,
}
MobileVerificationBoxOrangeThemeMobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
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

export const EmailVerificationBox = Template.bind({})
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

export const EmailVerificationBoxMobile = Template.bind({})
EmailVerificationBoxMobile.args = {
  fieldType: BasicField.Email,
}
EmailVerificationBoxMobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
