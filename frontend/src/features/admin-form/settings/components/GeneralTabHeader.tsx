import { Skeleton, Wrap } from '@chakra-ui/react'

import Badge from '~components/Badge'

import { RESPONSE_MODE_TO_TEXT } from '~features/admin-form/common/constants'

import { useAdminFormSettings } from '../queries'

import { CategoryHeader } from './CategoryHeader'

export const GeneralTabHeader = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const readableFormResponseMode = !settings
    ? 'Loading...'
    : RESPONSE_MODE_TO_TEXT[settings.responseMode]

  return (
    <Wrap
      shouldWrapChildren
      spacing="0.5rem"
      justify="space-between"
      mb="2.5rem"
    >
      <CategoryHeader mb={0}>General settings</CategoryHeader>
      <Skeleton isLoaded={!isLoadingSettings}>
        <Badge variant="subtle" colorScheme="primary" color="secondary.500">
          {readableFormResponseMode}
        </Badge>
      </Skeleton>
    </Wrap>
  )
}
