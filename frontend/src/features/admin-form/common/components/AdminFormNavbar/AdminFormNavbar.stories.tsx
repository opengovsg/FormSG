import { MemoryRouter, Route } from 'react-router-dom'
import { TabPanel, TabPanels } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { DateString } from '~shared/types/generic'

import { AdminFormTabProvider } from '../AdminFormTabProvider'

import { AdminFormNavbar, AdminFormNavbarProps } from './AdminFormNavbar'

export default {
  title: 'Features/AdminForm/AdminFormNavbar',
  component: AdminFormNavbar,
  decorators: [
    (storyFn) => {
      return (
        <MemoryRouter initialEntries={['/admin/forms/1']}>
          <Route path="/admin/forms/:formId">
            <AdminFormTabProvider>
              {storyFn()}
              <TabPanels>
                <TabPanel></TabPanel>
                <TabPanel></TabPanel>
                <TabPanel></TabPanel>
              </TabPanels>
            </AdminFormTabProvider>
          </Route>
        </MemoryRouter>
      )
    },
  ],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const mockForm = {
  _id: '1',
  title: 'Storybook Test Form',
  lastModified: '2020-01-01T00:00:00.000Z' as DateString,
} as AdminFormNavbarProps['formInfo']

const Template: Story<AdminFormNavbarProps> = (args) => (
  <AdminFormNavbar {...args} />
)
export const Default = Template.bind({})
Default.args = {
  formInfo: mockForm,
}

export const Skeleton = Template.bind({})
Skeleton.args = {
  formInfo: undefined,
}
