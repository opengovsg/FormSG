import { Meta, StoryFn } from '@storybook/react/*'

import { FormResponseMode, WorkflowType } from '~shared/types'

import { TABLE_FIELD_ADDITIONAL_ROWS_FIELD } from '~/mocks/msw/handlers/admin-form'
import { envHandlers } from '~/mocks/msw/handlers/env'
import {
  getEncryptedSubmissionResponse,
  getPublicFormResponse,
  postGenerateVfnOtpResponse,
  postVerifyVfnOtpResponse,
  postVfnTransactionResponse,
} from '~/mocks/msw/handlers/public-form'

import { StoryRouter } from '~utils/storybook'

import PublicFormPage from './PublicFormPage'
import SaveDraftSetupWrapper from './SaveDraftSetupWrapper'

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

const PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ADDITIONAL_ROWS =
  '{"table-field-for-test-id":{"fieldType":"table","answer":[{"table-field-for-test-id-col-1":"prev submission start 1/3","table-field-for-test-id-col-2":"cool beans"},{"table-field-for-test-id-col-1":"prev submission mid 2/3","table-field-for-test-id-col-2":"see ya later alligator"},{"table-field-for-test-id-col-1":"prev submission end 3/3","table-field-for-test-id-col-2":"far out man"}]}}'

// Only contains 1 row, while the minimum is 2.
const PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ONE_ROW =
  '{"table-field-for-test-id":{"fieldType":"table","answer":[{"table-field-for-test-id-col-1":"prev submission start and end 1/1","table-field-for-test-id-col-2":"cool beans"}]}}'

export const WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRows =
  Template.bind({})
WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRows.parameters = {
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
            _id: 'step-0',
            edit: ['table-field-for-test-id'],
            workflow_type: WorkflowType.Static,
            emails: [],
          },
          {
            _id: 'step-1',
            edit: [],
            workflow_type: WorkflowType.Static,
            emails: [],
          },
        ],
        form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
        encryptedContent: PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ADDITIONAL_ROWS,
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

export const WithMultiRespondentFormStep2EditableTableFieldLessThanMinimumRows =
  Template.bind({})

WithMultiRespondentFormStep2EditableTableFieldLessThanMinimumRows.parameters = {
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
            _id: 'step-0',
            edit: ['table-field-for-test-id'],
            workflow_type: WorkflowType.Static,
            emails: [],
          },
          {
            _id: 'step-1',
            edit: ['table-field-for-test-id'],
            workflow_type: WorkflowType.Static,
            emails: [],
          },
        ],
        form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
        workflowStep: 0,
        encryptedContent: PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ONE_ROW,
      },
    }),
    ...DEFAULT_MSW_HANDLERS,
  ],
}

const STEP_2_SAVED_DRAFT_RESPONSES = {
  'table-field-for-test-id': [
    {
      'table-field-for-test-id-col-1': 'this is saved draft 1/4',
      'table-field-for-test-id-col-2': 'cool beans',
    },
    {
      'table-field-for-test-id-col-1': 'this is saved draft 2/4',
      'table-field-for-test-id-col-2': 'cool beans',
    },
    {
      'table-field-for-test-id-col-1': 'this is saved draft 3/4',
      'table-field-for-test-id-col-2': 'cool beans',
    },
    {
      'table-field-for-test-id-col-1': 'this is saved draft 4/4',
      'table-field-for-test-id-col-2': 'cool beans',
    },
  ],
}

const STEP_2_TABLE_FIELD_ONLY_CHECKSUM = {
  'table-field-for-test-id':
    '{"title":"Table field for test","description":"No more table field regressions please","required":true,"disabled":false,"fieldType":"table","_id":"table-field-for-test-id","globalId":"not-used","minimumRows":2,"columns":[{"title":"Short text column","required":true,"columnType":"textfield","ValidationOptions":{"customVal":null,"selectedValidation":null},"_id":"table-field-for-test-id-col-1"},{"title":"Dropdown column","required":true,"columnType":"dropdown","fieldOptions":["cool beans","see ya later alligator","far out man"],"_id":"table-field-for-test-id-col-2"}],"addMoreRows":true,"maximumRows":4}',
}

export const WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRowsWithSaveDraft =
  Template.bind({})

WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRowsWithSaveDraft.parameters =
  {
    docs: {
      storyDescription:
        'This story asserts that the saved draft does not override the previous submission when the table field is non-editabl in the current mrf workflow step',
    },
    msw: [
      getPublicFormResponse({
        overrides: {
          form: {
            responseMode: FormResponseMode.Multirespondent,
            workflow: [],
            isSaveDraftEnabled: true,
          },
        },
      }),
      getEncryptedSubmissionResponse({
        overrides: {
          workflow: [
            {
              _id: 'step-0',
              edit: ['table-field-for-test-id'],
              workflow_type: WorkflowType.Static,
              emails: [],
            },
            {
              _id: 'step-1',
              edit: [],
              workflow_type: WorkflowType.Static,
              emails: [],
            },
          ],
          form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
          encryptedContent:
            PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ADDITIONAL_ROWS,
        },
      }),
      ...DEFAULT_MSW_HANDLERS,
    ],
  }

WithMultiRespondentFormStep2NonEditableTableFieldAdditionalRowsWithSaveDraft.decorators =
  [
    (Story) => (
      <SaveDraftSetupWrapper
        draftKey="formsg-save-draft-61540ece3d4a6e50ac0cc6ff-68d4b9900415e65225fd3e4e-step1"
        draftValue={{
          lastUpdated: new Date().getTime() - 10,
          draftResponses: STEP_2_SAVED_DRAFT_RESPONSES,
          fieldDefinitionsChecksum: STEP_2_TABLE_FIELD_ONLY_CHECKSUM,
        }}
      >
        <Story />
      </SaveDraftSetupWrapper>
    ),
  ]

export const WithMultiRespondentFormStep2EditableTableFieldAdditionalRowsWithSaveDraft =
  Template.bind({})

WithMultiRespondentFormStep2EditableTableFieldAdditionalRowsWithSaveDraft.parameters =
  {
    docs: {
      storyDescription:
        'This story asserts that the saved draft overrides the previous submission when the table field is editable in the current mrf workflow step',
    },
    msw: [
      getPublicFormResponse({
        overrides: {
          form: {
            responseMode: FormResponseMode.Multirespondent,
            workflow: [],
            isSaveDraftEnabled: true,
          },
        },
      }),
      getEncryptedSubmissionResponse({
        overrides: {
          workflow: [
            {
              _id: 'step-0',
              edit: ['table-field-for-test-id'],
              workflow_type: WorkflowType.Static,
              emails: [],
            },
            {
              _id: 'step-1',
              edit: ['table-field-for-test-id'],
              workflow_type: WorkflowType.Static,
              emails: [],
            },
          ],
          form_fields: [TABLE_FIELD_ADDITIONAL_ROWS_FIELD],
          encryptedContent:
            PREVIOUS_SUBMISSION_TABLE_FIELD_WITH_ADDITIONAL_ROWS,
        },
      }),
      ...DEFAULT_MSW_HANDLERS,
    ],
  }

WithMultiRespondentFormStep2EditableTableFieldAdditionalRowsWithSaveDraft.decorators =
  [
    (Story) => (
      <SaveDraftSetupWrapper
        draftKey="formsg-save-draft-61540ece3d4a6e50ac0cc6ff-68d4b9900415e65225fd3e4e-step1"
        draftValue={{
          lastUpdated: new Date().getTime() - 10,
          draftResponses: STEP_2_SAVED_DRAFT_RESPONSES,
          fieldDefinitionsChecksum: STEP_2_TABLE_FIELD_ONLY_CHECKSUM,
        }}
      >
        <Story />
      </SaveDraftSetupWrapper>
    ),
  ]
