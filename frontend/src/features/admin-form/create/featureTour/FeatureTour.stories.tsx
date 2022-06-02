import { Meta, Story } from '@storybook/react'

import { AdminFormDto } from '~shared/types/form'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'
import { getFreeSmsQuota } from '~/mocks/msw/handlers/admin-form/twilio'

import { AdminFormCreatePageDecorator } from '~utils/storybook'

import { CreatePage } from '../CreatePage'

const buildMswRoutes = (
  overrides?: Partial<AdminFormDto>,
  delay?: number | 'infinite' | 'real',
) => {
  return [
    ...createFormBuilderMocks(overrides, delay),
    getFreeSmsQuota({ delay }),
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
    chromatic: { pauseAnimationAtEnd: true, delay: 50 },
    layout: 'fullscreen',
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <CreatePage testUserId="featureTourUserId" />

export const AdminFormBuilderFeatureTour = Template.bind({})
