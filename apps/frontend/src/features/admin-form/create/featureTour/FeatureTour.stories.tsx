import { Meta, StoryFn } from '@storybook/react-vite'
import { expect, screen, waitFor } from 'storybook/test'

import { AdminFormDto } from 'formsg-shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormCollaborators,
} from '~/mocks/msw/handlers/admin-form'
import { getUser } from '~/mocks/msw/handlers/user'

import { AdminFormCreatePageDecorator } from '~utils/storybook'

import { CreatePage } from '../CreatePage'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay?: number | 'infinite' | 'real',
) => {
  return [
    ...createFormBuilderMocks(overrides, delay),
    getUser(),
    getAdminFormCollaborators(),
  ]
}

export default {
  title: 'Pages/FeatureTour/AdminFormBuilder',
  // component: To be implemented,
  decorators: [AdminFormCreatePageDecorator],
  parameters: {
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: buildMswRoutes(),
  },
} as Meta

const Template: StoryFn = () => <CreatePage />

export const AdminFormBuilderFeatureTour = Template.bind({})
// The tour starts once the user and form have loaded.
AdminFormBuilderFeatureTour.play = async () => {
  const next = await screen.findByRole('button', { name: 'Next' })
  // The tooltip is in the DOM before it is positioned and shown.
  await waitFor(() => expect(next).toBeVisible())
}
