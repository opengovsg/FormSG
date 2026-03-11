import { Meta, StoryFn } from '@storybook/react/*'

import { envHandlers } from '~/mocks/msw/handlers/env'
import { getPublicFormResponse } from '~/mocks/msw/handlers/public-form'
import { getStatusTrackerDataResponse } from '~/mocks/msw/status-tracker'

import { StoryRouter, viewports } from '~utils/storybook'

import { StatusTrackerPage } from './StatusTrackerPage'

const DEFAULT_MSW_HANDLERS = [
  ...envHandlers,
  getPublicFormResponse(),
  getStatusTrackerDataResponse(),
]

export default {
  title: 'Pages/PublicFormPage/FormPaymentPage',
  componnent: StatusTrackerPage,
  decorators: [
    StoryRouter({
      initialEntries: [
        `/61540ece3d4a6e50ac0cc6ff/status/61540ece3d4a6e50ac0cc700`,
      ],
      path: '/:formId/status/:submissionId',
    }),
  ],
  parameters: {
    // Required so skeleton "animation" does not hide content.
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: StoryFn = () => <StatusTrackerPage />

export const Desktop = Template.bind({})

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
