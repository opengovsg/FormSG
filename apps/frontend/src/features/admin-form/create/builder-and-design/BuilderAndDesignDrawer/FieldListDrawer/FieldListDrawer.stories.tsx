import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { DragDropContext } from '@hello-pangea/dnd'
import { StoryFn } from '@storybook/react-vite'
import { http, HttpResponse } from 'msw'

import { featureFlags } from 'formsg-shared/constants'
import {
  FormAuthType,
  FormId,
  FormResponseMode,
  FormStatus,
  FormWorkflowStepDto,
  FormWorkflowStepWriteDto,
  WorkflowType,
} from 'formsg-shared/types'

import {
  createMockForm,
  getAdminFormView,
} from '~/mocks/msw/handlers/admin-form'

import { StoryRouter } from '~utils/storybook'

import { CreatePageSidebarProvider } from '~features/admin-form/create/common'

import { FieldListDrawer } from '..'

export default {
  component: FieldListDrawer,
  title:
    'Features/AdminForm/create/builder-and-design/BuilderAndDesignDrawer/FieldListDrawer',
  parameters: {
    msw: [getAdminFormView({ mode: FormResponseMode.Encrypt })],
  },
  decorators: [
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
    (Story: StoryFn) => (
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      <DragDropContext onDragEnd={() => {}}>
        <CreatePageSidebarProvider>
          <Story />
        </CreatePageSidebarProvider>
      </DragDropContext>
    ),
  ],
}

const encryptModeHandlers = [
  getAdminFormView({ mode: FormResponseMode.Encrypt }),
]

const mrfModeHandlers = [
  getAdminFormView({ mode: FormResponseMode.Multirespondent }),
]

const emailModeHandlers = [getAdminFormView({ mode: FormResponseMode.Email })]

export const EncryptMode = {
  parameters: {
    msw: encryptModeHandlers,
  },
}

export const MrfMode = {
  parameters: {
    msw: mrfModeHandlers,
  },
}

export const EmailMode = {
  parameters: {
    msw: emailModeHandlers,
  },
}

const proposedFlags = new GrowthBook({
  features: {
    [featureFlags.mrfStepLogin]: { defaultValue: true },
    [featureFlags.isNricFieldEnabled]: { defaultValue: true },
  },
})
let proposedAuth = FormAuthType.NIL
let proposedSteps: FormWorkflowStepDto[] = []
const resetProposed = () => {
  proposedAuth = FormAuthType.NIL
  proposedSteps = [
    {
      _id: '61e6857c9c794b0012f1c6f8',
      workflow_type: WorkflowType.Static,
      step_name: 'Requester',
      emails: [],
      edit: [],
    },
    {
      _id: '61e6857c9c794b0012f1c6f9',
      workflow_type: WorkflowType.Static,
      step_name: 'Approving officer',
      emails: ['officer@example.gov.sg'],
      edit: [],
    },
  ]
}
resetProposed()
export const MissingProviderFieldsDisabled = {
  beforeEach: resetProposed,
  decorators: [
    (Story: StoryFn) => (
      <GrowthBookProvider growthbook={proposedFlags}>
        <Story />
      </GrowthBookProvider>
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v3/admin/forms/:formId', ({ params }) =>
          HttpResponse.json(
            createMockForm({
              _id: params.formId as FormId,
              responseMode: FormResponseMode.Multirespondent,
              status: FormStatus.Private,
              authType: proposedAuth,
              isSubmitterIdCollectionEnabled: false,
              form_fields: [],
              workflow: proposedSteps,
            }),
          ),
        ),
        http.put(
          '/api/v3/admin/forms/:formId/workflow/:stepNumber',
          async ({ request, params }) => {
            const body = (await request.json()) as FormWorkflowStepWriteDto
            const { first_step_login, ...step } = body
            if (first_step_login) proposedAuth = first_step_login.auth_type
            proposedSteps[Number(params.stepNumber)] = {
              ...step,
              _id: proposedSteps[Number(params.stepNumber)]._id,
            } as FormWorkflowStepDto
            return HttpResponse.json(proposedSteps)
          },
        ),
      ],
    },
  },
}

/** Matching authentication on a later step enables additions even on a live form. */
export const MatchingLaterProviderPublic = {
  ...MissingProviderFieldsDisabled,
  parameters: {
    msw: {
      handlers: [
        http.get('/api/v3/admin/forms/:formId', ({ params }) =>
          HttpResponse.json(
            createMockForm({
              _id: params.formId as FormId,
              responseMode: FormResponseMode.Multirespondent,
              status: FormStatus.Public,
              authType: FormAuthType.MyInfo,
              isSubmitterIdCollectionEnabled: false,
              form_fields: [],
              workflow: [
                {
                  _id: '61e6857c9c794b0012f1c6f8',
                  workflow_type: WorkflowType.Static,
                  emails: [],
                  edit: [],
                  step_name: 'Requester',
                },
                {
                  _id: '61e6857c9c794b0012f1c6f9',
                  workflow_type: WorkflowType.Static,
                  emails: ['officer@example.gov.sg'],
                  edit: [],
                  step_name: 'Officer',
                  auth: { auth_type: FormAuthType.CP, esrvc_id: 'service' },
                },
              ],
            }),
          ),
        ),
      ],
    },
  },
}
