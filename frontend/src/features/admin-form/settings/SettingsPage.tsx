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

export const SettingsPage = (): JSX.Element => {
  return (
    <Tabs isLazy isManual orientation="vertical" variant="line">
      <TabList flexShrink={0} p={0} w="21rem" maxW="100%">
        <SettingsTab label="General" icon={BiCog} />
        <SettingsTab label="Singpass" icon={BiKey} />
        <SettingsTab label="Thank you page" icon={BiCheckDouble} />
        <SettingsTab label="Email notifications" icon={BiMailSend} />
        <SettingsTab label="Webhooks" icon={BiCodeBlock} />
        <SettingsTab label="Workflow" icon={BiRocket} />
      </TabList>
      <TabPanels>
        <TabPanel>
          <p>one!</p>
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
