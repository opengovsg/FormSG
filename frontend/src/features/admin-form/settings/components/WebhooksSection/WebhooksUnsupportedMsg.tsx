import { Flex, Text } from '@chakra-ui/react'

import { GUIDE_WEBHOOKS } from '~constants/links'
import Link from '~components/Link'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

export const WebhooksUnsupportedMsg = (): JSX.Element => {
  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h4" as="h2" color="primary.500" mb="1rem">
        Webhooks are only available in storage mode
      </Text>
      <Text textStyle="body-1" color="secondary.500" mb="2.5rem">
        Webhooks are useful for agencies who wish to have form response data
        sent directly to existing IT systems. This feature is only available in
        storage mode.{' '}
        <Link isExternal href={GUIDE_WEBHOOKS}>
          Read more about webhooks
        </Link>
      </Text>
      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
