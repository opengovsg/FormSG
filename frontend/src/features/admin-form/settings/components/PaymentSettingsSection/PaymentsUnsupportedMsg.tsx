import { Flex, Text } from '@chakra-ui/react'
import { Link } from '@opengovsg/design-system-react'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

import { usePaymentGuideLink } from './queries'

export const PaymentsUnsupportedMsg = (): JSX.Element => {
  const { data: paymentGuideLink } = usePaymentGuideLink()
  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h4" as="h2" color="brand.primary.500" mb="1rem">
        Payments are only available in storage mode
      </Text>
      <Text textStyle="body-1" color="brand.secondary.500" mb="2.5rem">
        Respondents can now make payment for fees or services directly on your
        form. This feature is only available in storage mode.&nbsp;
        <Link isExternal href={paymentGuideLink}>
          Learn more about payments
        </Link>
      </Text>
      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
