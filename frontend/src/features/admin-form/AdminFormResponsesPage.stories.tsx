import { MemoryRouter, Route } from 'react-router'
import { Meta, Story } from '@storybook/react'

import { getAdminFormResponse } from '~/mocks/msw/handlers/admin-form'

import { viewports } from '~utils/storybook'

import { AdminFormPage } from './common/AdminFormPage'

export default {
  title: 'Pages/AdminFormPage/Responses',
  component: AdminFormPage,
  decorators: [
    (storyFn) => {
      // MemoryRouter is used so react-router-dom#Link components can work
      // (and also to force the initial tab the page renders to be the response tab).
      return (
        <MemoryRouter initialEntries={['/admin/form/1234/responses']}>
          <Route path="/admin/form/:formId">{storyFn()}</Route>
        </MemoryRouter>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
    msw: [getAdminFormResponse()],
  },
} as Meta

const Template: Story = () => <AdminFormPage />
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
