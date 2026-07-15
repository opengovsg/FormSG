import { useTranslation } from 'react-i18next'
import { Skeleton } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types/form'

import { CategoryHeader } from './components/CategoryHeader'
import { WebhooksSection } from './components/WebhooksSection'
import { WebhooksUnsupportedMsg } from './components/WebhooksSection/WebhooksUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsWebhooksPage = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useAdminFormSettings()

  const enableMrfWebhooks = useFeatureIsOn(featureFlags.enableMrfWebhooks)

  const enableWebhooks =
    !isLoading &&
    (settings?.responseMode == FormResponseMode.Encrypt ||
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

  const showWorkflowInfobox =
    settings?.responseMode === FormResponseMode.Multirespondent

  return (
    <Skeleton isLoaded={!isLoading}>
      <CategoryHeader>
        {t('features.adminForm.settings.webhooks.title')}
      </CategoryHeader>
      <WebhooksSection showWorkflowInfobox={showWorkflowInfobox} />
    </Skeleton>
  )
}
