import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types/form'

import { CategoryHeader } from './components/CategoryHeader'
import { WebhooksSection } from './components/WebhooksSection'
import { WebhooksErrorMsg } from './components/WebhooksSection/WebhooksErrorMsg'
import { WebhooksPlumberConnectedMsg } from './components/WebhooksSection/WebhooksPlumberConnectedMsg'
import { WebhooksUnsupportedMsg } from './components/WebhooksSection/WebhooksUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsWebhooksPage = (): JSX.Element => {
  const { t } = useTranslation()
  const {
    data: settings,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useAdminFormSettings()

  const enableMrfWebhooks = useFeatureIsOn(featureFlags.enableMrfWebhooks)

  if (isError) {
    return <WebhooksErrorMsg onRetry={refetch} isRetrying={isRefetching} />
  }

  const enableWebhooks =
    !isLoading &&
    (settings?.responseMode === FormResponseMode.Encrypt ||
      (settings?.responseMode === FormResponseMode.Multirespondent &&
        enableMrfWebhooks))

  const isPlumberConnected = /^https:\/\/plumber\.gov\.sg\/webhooks\//.test(
    settings?.webhook.url ?? '',
  )
  // NOTE: only show this page when the enableWebhooks flag is off.
  if (isPlumberConnected && !enableWebhooks) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <WebhooksPlumberConnectedMsg />
      </Skeleton>
    )
  }

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
