import { TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import { DateString } from '~shared/types/generic'

import { AdminFormNavbar, AdminFormNavbarProps } from './AdminFormNavbar'

export default {
  title: 'Features/AdminForm/AdminFormNavbar',
  component: AdminFormNavbar,
  decorators: [
    (storyFn) => {
      return (
        <Tabs>
          {storyFn()}
          <TabPanels>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
            <TabPanel></TabPanel>
          </TabPanels>
        </Tabs>
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
