import { Flex, TabPanel, TabPanels } from '@chakra-ui/react'

import { SettingsPage } from '../settings/SettingsPage'

import AdminFormNavbar from './components/AdminFormNavbar'
import { AdminFormTabProvider } from './components/AdminFormTabProvider'

export const AdminFormPage = (): JSX.Element => {
  return (
    <AdminFormTabProvider>
      <Flex flexDir="column" height="100vh" overflow="hidden" pos="relative">
        <Flex>
          <AdminFormNavbar />
        </Flex>
        <TabPanels overflow="auto" flex={1}>
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
      </Flex>
    </AdminFormTabProvider>
  )
}
