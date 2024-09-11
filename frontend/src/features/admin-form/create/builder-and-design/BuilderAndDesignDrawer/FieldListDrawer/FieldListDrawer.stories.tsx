import { DragDropContext } from 'react-beautiful-dnd'
import { StoryFn } from '@storybook/react'

import { FormResponseMode } from '~shared/types'

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
