import { MemoryRouter, Route } from 'react-router'
import { Routes } from 'react-router-dom'
import { Meta, Story } from '@storybook/react'

import { FormResponseMode } from '~shared/types/form'

import {
  createFormBuilderMocks,
  getAdminFormSubmissions,
  getStorageSubmissionMetadataResponse,
} from '~/mocks/msw/handlers/admin-form'

import {
  ADMINFORM_RESULTS_SUBROUTE,
  RESULTS_FEEDBACK_SUBROUTE,
} from '~constants/routes'
import { getMobileViewParameters, viewports } from '~utils/storybook'

import { AdminFormLayout } from './common/AdminFormLayout'
import { FeedbackPage, FormResultsLayout, ResponsesPage } from './responses'

export default {
  title: 'Pages/AdminFormPage/Results/ResponsesTab',
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: [...createFormBuilderMocks({}, 0), getAdminFormSubmissions()],
  },
} as Meta

const Template: Story = () => {
  return (
    <MemoryRouter initialEntries={['/12345/results']}>
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
export const EmailForm = Template.bind({})

export const EmailFormLoading = Template.bind({})
EmailFormLoading.parameters = EmailForm.parameters
EmailFormLoading.parameters = {
  msw: [
    ...createFormBuilderMocks({}, 0),
    getAdminFormSubmissions({ delay: 'infinite' }),
  ],
}

export const EmptyEmailForm = Template.bind({})
EmptyEmailForm.parameters = {
  msw: [
    ...createFormBuilderMocks({}, 0),
    getAdminFormSubmissions({
      override: 0,
    }),
  ],
}

export const EmailFormTablet = Template.bind({})
EmailFormTablet.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}

export const EmailFormMobile = Template.bind({})
EmailFormMobile.parameters = getMobileViewParameters()

export const StorageForm = Template.bind({})
StorageForm.parameters = {
  msw: [
    ...createFormBuilderMocks({ responseMode: FormResponseMode.Encrypt }, 0),
    getAdminFormSubmissions(),
    getStorageSubmissionMetadataResponse(),
  ],
}

export const StorageFormTablet = Template.bind({})
StorageFormTablet.parameters = {
  ...EmailFormTablet.parameters,
  ...StorageForm.parameters,
}

export const StorageFormMobile = Template.bind({})
StorageFormMobile.parameters = {
  ...EmailFormMobile.parameters,
  ...StorageForm.parameters,
}

export const StorageFormLoading = Template.bind({})
StorageFormLoading.parameters = StorageForm.parameters
StorageFormLoading.parameters = {
  msw: [
    ...createFormBuilderMocks({ responseMode: FormResponseMode.Encrypt }, 0),
    getAdminFormSubmissions({ delay: 'infinite' }),
    getStorageSubmissionMetadataResponse({}, 'infinite'),
  ],
}
