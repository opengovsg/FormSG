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

const stepLoginFlags = new GrowthBook({
  features: {
    [featureFlags.mrfStepLogin]: { defaultValue: true },
    [featureFlags.isNricFieldEnabled]: { defaultValue: true },
  },
})
export const MissingProviderFieldsDisabled = {
  decorators: [
    (Story: StoryFn) => (
      <GrowthBookProvider growthbook={stepLoginFlags}>
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
              authType: FormAuthType.NIL,
              isSubmitterIdCollectionEnabled: false,
              form_fields: [],
              workflow: [
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
              ],
            }),
          ),
        ),
      ],
    },
  },
}
