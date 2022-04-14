import { MemoryRouter, Route } from 'react-router'
import { Routes } from 'react-router-dom'
import { Meta, Story } from '@storybook/react'

import {
  createFormBuilderMocks,
  getStorageSubmissionMetadataResponse,
} from '~/mocks/msw/handlers/admin-form'

import {
  ADMINFORM_RESULTS_SUBROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
} from '~constants/routes'
import { viewports } from '~utils/storybook'

import { AdminFormLayout } from './common/AdminFormLayout'
import { FeedbackPage, FormResultsLayout, ResponsesPage } from './responses'

export default {
  title: 'Pages/AdminFormPage/Results/FeedbackTab',
  component: FeedbackPage,
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: [...createFormBuilderMocks(), getStorageSubmissionMetadataResponse()],
  },
} as Meta

const Template: Story = () => {
  return (
    <MemoryRouter
      initialEntries={['/61540ece3d4a6e50ac0cc6ff/results/feedback']}
    >
      <Routes>
        <Route path="/:formId" element={<AdminFormLayout />}>
          <Route
            path={ADMINFORM_RESULTS_SUBROUTE}
            element={<FormResultsLayout />}
          >
            <Route index element={<ResponsesPage />} />
            <Route
              path={RESULTS_FEEDBACK_SUBROUTE}
              element={<FeedbackPage />}
            />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  )
}
export const Default = Template.bind({})

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
