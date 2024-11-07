import { Meta, StoryFn } from '@storybook/react'

import { AdminFormDto } from '~shared/types/form'

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
    // Required so skeleton "animation" does not hide content.
    // Pass a very short delay to avoid bug where Chromatic takes a snapshot before
    // the story has loaded
    chromatic: { pauseAnimationAtEnd: true, delay: 200 },
    layout: 'fullscreen',
    msw: buildMswRoutes(),
  },
} as Meta

const Template: StoryFn = () => <CreatePage />

export const AdminFormBuilderFeatureTour = Template.bind({})
