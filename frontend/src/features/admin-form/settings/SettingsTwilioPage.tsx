import { Flex } from '@chakra-ui/react'

import { CategoryHeader } from './components/CategoryHeader'
import { TwilioSettingsSection } from './components/TwilioSettingsSection'
import { FreeSmsQuota } from './components/TwilioSettingsSection/FreeSmsQuota'

export const SettingsTwilioPage = (): JSX.Element => {
  return (
    <>
      <Flex justify="space-between" align="center" mb="2.5rem">
        <CategoryHeader mb={0}>Twilio credentials</CategoryHeader>
        <FreeSmsQuota />
      </Flex>
      <TwilioSettingsSection />
    </>
  )
}
