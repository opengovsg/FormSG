import { MemoryRouter, Route } from 'react-router'
import { Routes } from 'react-router-dom'
import { Meta, Story } from '@storybook/react'

import { AdminFormDto } from '~shared/types/form'

import {
  createFormBuilderMocks,
  MOCK_FORM_FIELDS,
} from '~/mocks/msw/handlers/admin-form'
import { getFreeSmsQuota } from '~/mocks/msw/handlers/admin-form/twilio'

import { viewports } from '~utils/storybook'

import { CreatePage } from '~features/admin-form/create/CreatePage'

import { AdminFormLayout } from './common/AdminFormLayout'

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
  title: 'Pages/AdminFormPage/Create',
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
    chromatic: { pauseAnimationAtEnd: true },
    layout: 'fullscreen',
    msw: buildMswRoutes(),
  },
} as Meta

const Template: Story = () => <CreatePage />
export const DesktopEmpty = Template.bind({})
export const DesktopAllFields = Template.bind({})
DesktopAllFields.parameters = {
  msw: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS }),
}

export const TabletEmpty = Template.bind({})
TabletEmpty.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
}
export const TabletAllFields = Template.bind({})
TabletAllFields.parameters = {
  viewport: {
    defaultViewport: 'tablet',
  },
  chromatic: { viewports: [viewports.md] },
  msw: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS }),
}

export const MobileEmpty = Template.bind({})
MobileEmpty.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}
export const MobileAllFields = Template.bind({})
MobileAllFields.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
  msw: buildMswRoutes({ form_fields: MOCK_FORM_FIELDS }),
}
