import { Skeleton, Text } from '@chakra-ui/react'

import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import { useAdminForm } from '~features/admin-form/common/queries'

import { TwilioDetailsInput } from './TwilioDetailsInput'

export const TwilioSettingsSection = (): JSX.Element => {
  const { data: form } = useAdminForm()
  return (
    <>
      <Text mb="1rem">
        Add your Twilio credentials to pay for Verified SMSes beyond the free
        tier of 10,000 SMSes.{' '}
        <Link
          href="https://guide.form.gov.sg/AdvancedGuide.html#how-do-i-arrange-payment-for-verified-sms"
          isExternal
        >
          How to find your credentials
        </Link>
      </Text>
      <InlineMessage mb="1rem">
        To verify your credentials are correct, please test it in your form
        before activating.
      </InlineMessage>
      <Skeleton isLoaded={!!form}>
        <TwilioDetailsInput hasExistingTwilioCreds={!!form?.msgSrvcName} />
      </Skeleton>
    </>
  )
}
