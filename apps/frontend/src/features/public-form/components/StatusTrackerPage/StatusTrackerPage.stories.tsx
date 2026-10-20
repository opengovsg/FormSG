import { Meta, StoryFn } from '@storybook/react-vite'

import { envHandlers } from '~/mocks/msw/handlers/env'
import { getPublicFormResponse } from '~/mocks/msw/handlers/public-form'
import { getStatusTrackerDataResponse } from '~/mocks/msw/status-tracker'

import { StoryRouter, viewportModes } from '~utils/storybook'

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
    layout: 'fullscreen',
    // Pages fill the viewport; fit-to-content would crop them.
    argos: { fitToContent: false },
    msw: DEFAULT_MSW_HANDLERS,
  },
} as Meta

const Template: StoryFn = () => <StatusTrackerPage />

export const Desktop = Template.bind({})
Desktop.parameters = { argos: { modes: viewportModes('tablet', 'mobile') } }
