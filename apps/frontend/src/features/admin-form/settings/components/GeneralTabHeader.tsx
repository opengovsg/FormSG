import { useTranslation } from 'react-i18next'
import { Skeleton, Wrap } from '@chakra-ui/react'

import Badge from '~components/Badge'

import { useResponseModeBadgeLabel } from '~features/admin-form/common/useResponseModeBadgeLabel'

import { useAdminFormSettings } from '../queries'

import { CategoryHeader } from './CategoryHeader'

export const GeneralTabHeader = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const responseModeBadgeLabel = useResponseModeBadgeLabel(
    settings?.responseMode,
  )
  // A null label means no badge should be shown (e.g. MRF forms during cutover).
  const readableFormResponseMode = !settings
    ? t('features.common.loadingWithEllipsis')
    : responseModeBadgeLabel

  return (
    <Wrap
      shouldWrapChildren
      spacing="0.5rem"
      justify="space-between"
      mb="2.5rem"
    >
      <CategoryHeader mb={0}>
        {t('features.adminForm.settings.general.title')}
      </CategoryHeader>
      {readableFormResponseMode !== null && (
        <Skeleton isLoaded={!isLoadingSettings}>
          <Badge variant="subtle" colorScheme="primary" color="secondary.500">
            {readableFormResponseMode}
          </Badge>
        </Skeleton>
      )}
    </Wrap>
  )
}
