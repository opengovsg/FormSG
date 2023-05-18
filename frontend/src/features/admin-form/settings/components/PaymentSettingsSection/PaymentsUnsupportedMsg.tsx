import { Flex, Text } from '@chakra-ui/react'

import { GUIDE_PAYMENTS } from '~constants/links'
import Link from '~components/Link'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

export const PaymentsUnsupportedMsg = (): JSX.Element => {
  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        Payments are not available in Email mode
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        Citizens can now make payment for fees or services directly on your
        form. This feature is only available in Storage Mode.&nbsp;
        <Link isExternal href={GUIDE_PAYMENTS}>
          Learn more about payments
        </Link>
      </Text>
      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
