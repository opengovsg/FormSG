import { MemoryRouter, Route } from 'react-router'
import { Routes } from 'react-router-dom'
import { Meta, Story } from '@storybook/react'

import { AdminFormDto } from '~shared/types/form'

import { createFormBuilderMocks } from '~/mocks/msw/handlers/admin-form'
import { getFreeSmsQuota } from '~/mocks/msw/handlers/admin-form/twilio'

import { AdminFormLayout } from '../../common/AdminFormLayout'
import { CreatePage, CreatePageProps } from '../CreatePage'

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
  decorators: [
    (storyFn) => {
      // MemoryRouter is used so react-router-dom#Link components can work
      // (and also to force the initial tab the page renders to be the settings tab).
      return (
        <MemoryRouter initialEntries={['/12345']}>
          <Routes>
            <Route path={'/:formId'} element={<AdminFormLayout />}>
              <Route index element={storyFn()} />
            </Route>
          </Routes>
        </MemoryRouter>
      )
    },
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    // Pass a very short delay to avoid bug where Chromatic takes a snapshot before
    // the story has loaded
    chromatic: { pauseAnimationAtEnd: true, delay: 50 },
    layout: 'fullscreen',
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story<CreatePageProps> = (args) => <CreatePage {...args} />

export const AdminFormBuilderFeatureTour = Template.bind({})
AdminFormBuilderFeatureTour.args = {
  shouldFeatureTourRun: true,
}
