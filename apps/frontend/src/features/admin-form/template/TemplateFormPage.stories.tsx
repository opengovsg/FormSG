import { Meta, StoryFn } from '@storybook/react-vite'

import { FormResponseMode } from 'formsg-shared/types'

import { TABLE_FIELD_ADDITIONAL_ROWS_FIELD } from '~/mocks/msw/handlers/admin-form'
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
import { StoryRouter, viewportModes } from '~utils/storybook'

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
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: StoryFn = () => <TemplateFormPage />
export const Default = Template.bind({})
Default.parameters = { argos: { modes: viewportModes('mobile') } }

export const FormNotFound = Template.bind({})
FormNotFound.parameters = {
  argos: { modes: viewportModes('mobile') },
  msw: [getTemplateFormErrorResponse()],
}

export const MultirespondentFormWithAdditionalRowsTableField = Template.bind({})
MultirespondentFormWithAdditionalRowsTableField.parameters = {
  docs: {
    storyDescription: `There should be ${TABLE_FIELD_ADDITIONAL_ROWS_FIELD.minimumRows} rows since the minimum rows is ${TABLE_FIELD_ADDITIONAL_ROWS_FIELD.minimumRows}`,
  },
  msw: [
    getTemplateFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Multirespondent,
          workflow: [],
          form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
        },
      },
    }),
  ],
}
