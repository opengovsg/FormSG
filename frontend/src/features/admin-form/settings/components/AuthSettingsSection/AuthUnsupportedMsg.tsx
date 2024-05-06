import { Flex, Text } from '@chakra-ui/react'
import { Link } from '@opengovsg/design-system-react'

import { GUIDE_ENABLE_SPCP } from '~constants/links'

import { SettingsUnsupportedSvgr } from '~features/admin-form/settings/svgrs/SettingsUnsupportedSvgr'

export const AuthUnsupportedMsg = (): JSX.Element => {
  return (
    <Flex justify="center" flexDir="column" textAlign="center">
      <Text textStyle="h4" as="h2" color="brand.primary.500" mb="1rem">
        Singpass authentication is not available in multi-respondent forms
      </Text>
      <Text textStyle="body-1" color="brand.secondary.500" mb="2.5rem">
        This feature is only available in email mode and storage mode.{' '}
        <Link isExternal href={GUIDE_ENABLE_SPCP}>
          Read more about Singpass authentication
        </Link>
      </Text>
      <SettingsUnsupportedSvgr />
    </Flex>
  )
}
