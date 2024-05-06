import { useMemo } from 'react'
import { Skeleton, Wrap } from '@chakra-ui/react'
import { Badge } from '@opengovsg/design-system-react'

import { FormResponseMode } from '~shared/types/form'

import { useAdminFormSettings } from '../queries'

import { CategoryHeader } from './CategoryHeader'

export const GeneralTabHeader = (): JSX.Element => {
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const readableFormResponseMode = useMemo(() => {
    switch (settings?.responseMode) {
      case FormResponseMode.Email:
        return 'Email mode'
      case FormResponseMode.Encrypt:
        return 'Storage mode'
      case FormResponseMode.Multirespondent:
        return 'Multi-respondent form'
    }
    return 'Loading...'
  }, [settings?.responseMode])
  return (
    <Wrap
      shouldWrapChildren
      spacing="0.5rem"
      justify="space-between"
      mb="2.5rem"
    >
      <CategoryHeader mb={0}>General settings</CategoryHeader>
      <Skeleton isLoaded={!isLoadingSettings}>
        <Badge variant="subtle" colorScheme="sub">
          {readableFormResponseMode}
        </Badge>
      </Skeleton>
    </Wrap>
  )
}
