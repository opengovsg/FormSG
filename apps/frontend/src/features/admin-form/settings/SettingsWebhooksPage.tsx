import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'
import { useFeatureIsOn, useGrowthBook } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types/form'

import { useUser } from '~features/user/queries'

import { CategoryHeader } from './components/CategoryHeader'
import { WebhooksSection } from './components/WebhooksSection'
import { WebhooksErrorMsg } from './components/WebhooksSection/WebhooksErrorMsg'
import { WebhooksUnsupportedMsg } from './components/WebhooksSection/WebhooksUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsWebhooksPage = (): JSX.Element => {
  const { t } = useTranslation()
  const gb = useGrowthBook()
  const {
    data: settings,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useAdminFormSettings()
  const userRes = useUser()

  useEffect(() => {
    gb?.setAttributes({
      adminEmail: userRes.user?.email,
    })
  }, [userRes.user?.email, gb])

  const enableMrfWebhooks = useFeatureIsOn(featureFlags.enableMrfWebhooks)

  // The settings fetch failed. Show an explicit error/retry state instead of
  // misreporting the form's response mode as unsupported.
  if (isError) {
    return <WebhooksErrorMsg onRetry={refetch} isRetrying={isRefetching} />
  }

  const enableWebhooks =
    !isLoading &&
    (settings?.responseMode === FormResponseMode.Encrypt ||
      (settings?.responseMode === FormResponseMode.Multirespondent &&
        enableMrfWebhooks))

  // Webhooks are only supported in storage mode; show message if form response mode is not storage
  if (!enableWebhooks) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <WebhooksUnsupportedMsg />
      </Skeleton>
    )
  }

  return (
    <Skeleton isLoaded={!isLoading}>
      <CategoryHeader>
        {t('features.adminForm.settings.webhooks.title')}
      </CategoryHeader>
      <WebhooksSection />
    </Skeleton>
  )
}
