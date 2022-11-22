import { Meta, Story } from '@storybook/react'

import {
  getTemplateFormErrorResponse,
  getTemplateFormResponse,
} from '~/mocks/msw/handlers/admin-form/template-form'
import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  postGenerateVfnOtpResponse,
  postVerifyVfnOtpResponse,
  postVfnTransactionResponse,
} from '~/mocks/msw/handlers/public-form'

import { ADMINFORM_USETEMPLATE_ROUTE } from '~constants/routes'
import { getMobileViewParameters, StoryRouter } from '~utils/storybook'

import TemplateFormPage from './TemplateFormPage'

const DEFAULT_MSW_HANDLERS = [
  ...envHandlers,
  getTemplateFormResponse(),
  postVfnTransactionResponse(),
  postGenerateVfnOtpResponse(),
  postVerifyVfnOtpResponse(),
]

export default {
  title: 'Pages/TemplateFormPage',
  component: TemplateFormPage,
  decorators: [
    StoryRouter({
      initialEntries: ['/61540ece3d4a6e50ac0cc6ff/use-template'],
      path: `/:formId/${ADMINFORM_USETEMPLATE_ROUTE}`,
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: Story = () => <TemplateFormPage />
export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const FormNotFound = Template.bind({})
FormNotFound.parameters = {
  msw: [getTemplateFormErrorResponse()],
}

export const FormNotFoundMobile = Template.bind({})
FormNotFoundMobile.parameters = {
  ...FormNotFound.parameters,
  ...getMobileViewParameters(),
}
