import { Text } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'

import { CategoryHeader } from './components/CategoryHeader'
import { TwilioSettingsSection } from './components/TwilioSettingsSection'

export const SettingsTwilioPage = (): JSX.Element => {
  return (
    <>
      <CategoryHeader>Twilio credentials</CategoryHeader>
      <Text>
        Add your Twilio credentials to pay for Verified SMSes beyond the free
        tier of 10,000 SMSes. How to find your credentials ↪
      </Text>
      <InlineMessage mb="1.25rem">
        To verify your credentials are correct, please test it in your form
        before activating.
      </InlineMessage>
      <TwilioSettingsSection />
    </>
  )
}
