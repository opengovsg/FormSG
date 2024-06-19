import { Text } from '@chakra-ui/react'

import { GUIDE_SPCP_ESRVCID } from '~constants/links'
import Link from '~components/Link'

export const AuthSettingsDescriptionText = () => {
  return (
    <Text
      textStyle="subhead-1"
      color="secondary.500"
      marginBottom="40px"
      marginTop="40px"
    >
      Authenticate respondents by NRIC.{' '}
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
