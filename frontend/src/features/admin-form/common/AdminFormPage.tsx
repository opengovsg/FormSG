import { TabPanel, TabPanels } from '@chakra-ui/react'

import { SettingsPage } from '../settings/SettingsPage'

import AdminFormNavbar from './components/AdminFormNavbar'
import { AdminFormTabProvider } from './components/AdminFormTabProvider'

export const AdminFormPage = (): JSX.Element => {
  return (
    <AdminFormTabProvider>
      <AdminFormNavbar />
      <TabPanels>
        <TabPanel p={0}>
          <p>Insert builder page here!</p>
        </TabPanel>
        <TabPanel p={0}>
          <SettingsPage />
        </TabPanel>
        <TabPanel p={0}>
          <p>Insert results page here!</p>
        </TabPanel>
      </TabPanels>
    </AdminFormTabProvider>
  )
}
