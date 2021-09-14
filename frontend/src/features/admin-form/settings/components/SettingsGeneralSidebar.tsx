import {
  BiCheckDouble,
  BiCodeBlock,
  BiCog,
  BiKey,
  BiMailSend,
  BiRocket,
} from 'react-icons/bi'
import { TabList } from '@chakra-ui/react'

import { SettingsTab } from './SettingsTab'

export const SettingsGeneralSidebar = (): JSX.Element => {
  return (
    <TabList flexShrink={0} p={0} w="21rem" maxW="100%">
      <SettingsTab label="General" icon={BiCog} />
      <SettingsTab label="Singpass" icon={BiKey} />
      <SettingsTab label="Thank you page" icon={BiCheckDouble} />
      <SettingsTab label="Email notifications" icon={BiMailSend} />
      <SettingsTab label="Webhooks" icon={BiCodeBlock} />
      <SettingsTab label="Workflow" icon={BiRocket} />
    </TabList>
  )
}
