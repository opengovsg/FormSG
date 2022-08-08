import { Skeleton, Text } from '@chakra-ui/react'

import { GUIDE_TWILIO } from '~constants/links'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'

import { useFreeSmsQuota } from '~features/admin-form/common/queries'

import { TwilioDetailsInputs } from './TwilioDetailsInputs'

export const TwilioSettingsSection = (): JSX.Element => {
  const { data: freeSmsQuota } = useFreeSmsQuota()

  return (
    <>
      <Text mb="1rem">
        Add your Twilio credentials to pay for Verified SMSes beyond the free
        tier of&nbsp;
        <Skeleton as="span" isLoaded={!!freeSmsQuota}>
          {freeSmsQuota?.quota.toLocaleString() ?? '10,000'}
        </Skeleton>
        &nbsp;SMSes.&nbsp;
        <Link href={GUIDE_TWILIO} isExternal>
          How to find your credentials
        </Link>
      </Text>
      <InlineMessage mb="1rem">
        Please test SMS verification in your form to verify that your
        credentials work
      </InlineMessage>
      <TwilioDetailsInputs />
    </>
  )
}
