import { StoryRouter } from '~utils/storybook'
import PublicFormPage from './PublicFormPage'
import { Meta, StoryFn } from '@storybook/react/*'
import {
  getEncryptedSubmissionResponse,
  getPublicFormResponse,
  postVfnTransactionResponse,
  postGenerateVfnOtpResponse,
  postVerifyVfnOtpResponse,
} from '~/mocks/msw/handlers/public-form'
import { envHandlers } from '~/mocks/msw/handlers/env'
import { FormResponseMode, WorkflowType } from '~shared/types'
import { TABLE_FIELD_ADDITIONAL_ROWS_FIELD } from '~/mocks/msw/handlers/admin-form'

const DEFAULT_MSW_HANDLERS = [
  ...envHandlers,
  getPublicFormResponse(),
  postVfnTransactionResponse(),
  postGenerateVfnOtpResponse(),
  postVerifyVfnOtpResponse(),
  getEncryptedSubmissionResponse(),
]

export default {
  title: 'Pages/PublicFormPageMrfSubsequentSteps',
  component: PublicFormPage,
  decorators: [
    StoryRouter({
      initialEntries: [
        `/61540ece3d4a6e50ac0cc6ff/edit/68d4b9900415e65225fd3e4e?key=mock-key`,
      ],
      path: '/:formId/edit/:submissionId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: StoryFn = () => <PublicFormPage />

export const WithMultiRespondentFormStep2TableFieldAdditionalRows =
  Template.bind({})

WithMultiRespondentFormStep2TableFieldAdditionalRows.parameters = {
  msw: [
    getPublicFormResponse({
      overrides: {
        form: {
          responseMode: FormResponseMode.Multirespondent,
          workflow: [],
        },
      },
    }),
    getEncryptedSubmissionResponse({
      overrides: {
        workflow: [
          {
            _id: 'step-1',
            edit: ['table-field-for-test-id'],
            workflow_type: WorkflowType.Static,
            emails: [],
          },
          {
            _id: 'step-2',
            edit: [],
            workflow_type: WorkflowType.Static,
            emails: [],
          },
        ],
        form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
        encryptedContent:
          '{"table-field-for-test-id":{"fieldType":"table","answer":[{"table-field-for-test-id-col-1":"start 1/3","table-field-for-test-id-col-2":"cool beans"},{"table-field-for-test-id-col-1":"mid 2/3","table-field-for-test-id-col-2":"see ya later alligator"},{"table-field-for-test-id-col-1":"end 3/3","table-field-for-test-id-col-2":"far out man"}]}}',
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}
