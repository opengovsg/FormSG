import { Wrap } from '@chakra-ui/react'

import { CategoryHeader } from './components/CategoryHeader'
import { TwilioSettingsSection } from './components/TwilioSettingsSection'
import { FreeSmsQuota } from './components/TwilioSettingsSection/FreeSmsQuota'

export const SettingsTwilioPage = (): JSX.Element => {
  return (
    <>
      <Wrap
        shouldWrapChildren
        justify="space-between"
        align="center"
        mb="2.5rem"
      >
        <CategoryHeader mb={0} mr="2rem">
          Twilio credentials
        </CategoryHeader>
        <FreeSmsQuota />
      </Wrap>
      <TwilioSettingsSection />
    </>
  )
}
