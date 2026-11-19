import { useTranslation } from 'react-i18next'
import { Divider, Skeleton } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import {
  featureFlags,
  PLUMBER_WEBHOOK_URL_REGEX,
} from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types/form'

import { CategoryHeader } from './components/CategoryHeader'
import { EmailJsonToggle } from './components/EmailJsonToggle'
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
  // TODO (settings-integrations-json): remove the flag when GA
  const isIntegrationsOn = useFeatureIsOn(featureFlags.settingsIntegrationsJson)

  if (isError) {
    return <WebhooksErrorMsg onRetry={refetch} isRetrying={isRefetching} />
  }

  const enableWebhooks =
    !isLoading &&
    (settings?.responseMode === FormResponseMode.Encrypt ||
      (settings?.responseMode === FormResponseMode.Multirespondent &&
        enableMrfWebhooks))

  const isPlumberConnected = PLUMBER_WEBHOOK_URL_REGEX.test(
    settings?.webhook.url ?? '',
  )
  // The JSON toggle shows whatever state the webhooks part is in
  const emailJsonSetting = isIntegrationsOn ? (
    <>
      <Divider my="2.5rem" />
      <EmailJsonToggle />
    </>
  ) : null

  // NOTE: only show this page when the enableWebhooks flag is off.
  if (isPlumberConnected && !enableWebhooks) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <WebhooksPlumberConnectedMsg />
        {emailJsonSetting}
      </Skeleton>
    )
  }

  // Webhooks are only supported in storage mode; show message if form response mode is not storage
  if (!enableWebhooks) {
    return (
      <Skeleton isLoaded={!isLoading}>
        <WebhooksUnsupportedMsg />
        {emailJsonSetting}
      </Skeleton>
    )
  }

  return (
    <Skeleton isLoaded={!isLoading}>
      <CategoryHeader>
        {isIntegrationsOn
          ? t('features.adminForm.settings.webhooks.integrationsTitle')
          : t('features.adminForm.settings.webhooks.title')}
      </CategoryHeader>
      <WebhooksSection />
      {emailJsonSetting}
    </Skeleton>
  )
}
