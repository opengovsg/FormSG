import {
  BiCheckDouble,
  BiCodeBlock,
  BiCog,
  BiKey,
  BiMailSend,
  BiRocket,
} from 'react-icons/bi'
import { TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'

import { SettingsTab } from './components/SettingsTab'
import { SettingsGeneralPage } from './SettingsGeneralPage'

export const SettingsPage = (): JSX.Element => {
  return (
    <Tabs
      isLazy
      isManual
      orientation="vertical"
      variant="line"
      py="4rem"
      px="2rem"
    >
      <TabList
        flexShrink={0}
        p={0}
        h="max-content"
        w="21rem"
        maxW="100%"
        position="sticky"
        mt="-0.875rem"
        top="7.125rem"
      >
        <SettingsTab label="General" icon={BiCog} />
        <SettingsTab label="Singpass" icon={BiKey} />
        <SettingsTab label="Thank you page" icon={BiCheckDouble} />
        <SettingsTab label="Email notifications" icon={BiMailSend} />
        <SettingsTab label="Webhooks" icon={BiCodeBlock} />
        <SettingsTab label="Workflow" icon={BiRocket} />
      </TabList>
      <TabPanels>
        <TabPanel>
          <SettingsGeneralPage />
        </TabPanel>
        <TabPanel>
          <p>two!</p>
        </TabPanel>
        <TabPanel>
          <p>3!</p>
        </TabPanel>
        <TabPanel>
          <p>4!</p>
        </TabPanel>
        <TabPanel>
          <p>5!</p>
        </TabPanel>
        <TabPanel>
          <p>6!</p>
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}
