import { MemoryRouter, Route } from 'react-router'
import { Routes } from 'react-router-dom'
import { Meta, StoryFn } from '@storybook/react'

import {
  createFormBuilderMocks,
  getAdminFormCollaborators,
  getAdminFormFeedback,
  getAdminFormIssue,
  getEmptyAdminFormFeedback,
  getEmptyAdminFormIssue,
  getStorageSubmissionMetadataResponse,
} from '~/mocks/msw/handlers/admin-form'
import { getUser } from '~/mocks/msw/handlers/user'

import {
  ADMINFORM_RESULTS_SUBROUTE,
  ADMINFORM_ROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
} from '~constants/routes'
import { getMobileViewParameters, viewports } from '~utils/storybook'

import { AdminFormLayout } from './common/AdminFormLayout'
import { FeedbackPage, FormResultsLayout, ResponsesPage } from './responses'

const DEFAULT_MSW_ROUTES = [
  ...createFormBuilderMocks({}, 0),
  getStorageSubmissionMetadataResponse(),
  getAdminFormFeedback(),
  getAdminFormIssue(),
  getUser(),
  getAdminFormCollaborators(),
]

export default {
  title: 'Pages/AdminFormPage/Results/FeedbackTab',
  component: FeedbackPage,
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: DEFAULT_MSW_ROUTES,
  },
} as Meta

const Template: StoryFn = () => {
  return (
    <MemoryRouter
      initialEntries={[
        `${ADMINFORM_ROUTE}/61540ece3d4a6e50ac0cc6ff/${ADMINFORM_RESULTS_SUBROUTE}/${RESULTS_FEEDBACK_SUBROUTE}`,
      ]}
    >
      <Routes>
        <Route
          path={`${ADMINFORM_ROUTE}/:formId`}
          element={<AdminFormLayout />}
        >
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

export const EmptyReviewAndIssue = Template.bind({})
EmptyReviewAndIssue.parameters = {
  msw: [
    getEmptyAdminFormIssue(),
    getEmptyAdminFormFeedback(),
    ...DEFAULT_MSW_ROUTES,
  ],
}

export const EmptyReview = Template.bind({})
EmptyReview.parameters = {
  msw: [getEmptyAdminFormFeedback(), ...DEFAULT_MSW_ROUTES],
}
export const EmptyIssue = Template.bind({})
EmptyIssue.parameters = {
  msw: [getEmptyAdminFormIssue(), ...DEFAULT_MSW_ROUTES],
}

export const Tablet = Template.bind({})
Tablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

export const Mobile = Template.bind({})
Mobile.parameters = getMobileViewParameters()

export const LoadingDesktop = Template.bind({})
LoadingDesktop.storyName = 'Loading/Desktop'
LoadingDesktop.parameters = {
  msw: [getAdminFormIssue({ delay: 'infinite' }), ...DEFAULT_MSW_ROUTES],
}
export const LoadingMobile = Template.bind({})
LoadingMobile.storyName = 'Loading/Mobile'
LoadingMobile.parameters = {
  ...getMobileViewParameters(),
  ...LoadingDesktop.parameters,
}
