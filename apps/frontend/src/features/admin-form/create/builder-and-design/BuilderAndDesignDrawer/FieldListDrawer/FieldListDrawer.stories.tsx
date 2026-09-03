import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react'
import { DragDropContext } from '@hello-pangea/dnd'
import { StoryFn } from '@storybook/react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'

import { getAdminFormView } from '~/mocks/msw/handlers/admin-form'

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

const timeFieldOn = new GrowthBook({
  features: { [featureFlags.timeField]: { defaultValue: true } },
})

/**
 * The Time field is gated behind `time-field` while it stabilises, so it is
 * absent from the other stories. This one turns it on.
 */
export const WithTimeField = {
  parameters: {
    msw: encryptModeHandlers,
  },
  decorators: [
    (Story: StoryFn) => (
      <GrowthBookProvider growthbook={timeFieldOn}>
        <Story />
      </GrowthBookProvider>
    ),
  ],
}
