import { Flex, Text } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { GUIDE_WEBHOOKS } from '~constants/links'
import Link from '~components/Link'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

type WebhooksUnsupportedMsgProps = {
  responseMode?: FormResponseMode
}

export const WebhooksUnsupportedMsg = ({
  responseMode,
}: WebhooksUnsupportedMsgProps): JSX.Element => {
  const modeText =
    responseMode === FormResponseMode.Email
      ? 'email mode'
      : 'multi-respondent forms'

  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h2" as="h2" color="primary.500" mb="1rem">
        Webhooks are not available in {modeText}
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
