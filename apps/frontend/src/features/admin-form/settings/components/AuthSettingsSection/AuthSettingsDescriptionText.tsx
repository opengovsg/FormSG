import { Text } from '@chakra-ui/react'

import Link from '~components/Link'
import { GUIDE_SPCP_ESRVCID } from '~constants/links'

export const AuthSettingsDescriptionText = () => {
  return (
    <Text textStyle="subhead-1" color="secondary.500" mb="2.5rem" mt="2.5rem">
      Authenticate respondents via Singpass.{' '}
      <Link
        textStyle="subhead-1"
        href={GUIDE_SPCP_ESRVCID}
        isExternal
        // Needed for link to open since there are nested onClicks
        onClickCapture={(e) => e.stopPropagation()}
      >
        Learn more about Singpass authentication
      </Link>
    </Text>
  )
}
