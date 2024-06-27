import { Skeleton } from '@chakra-ui/react'

import Toggle from '~components/Toggle'

import { AuthSettingsDescriptionText } from './AuthSettingsDescriptionText'

export const AuthSettingsSectionSkeleton = (): JSX.Element => {
  return (
    <Skeleton>
      <AuthSettingsDescriptionText />
      <Toggle label="" />
    </Skeleton>
  )
}
