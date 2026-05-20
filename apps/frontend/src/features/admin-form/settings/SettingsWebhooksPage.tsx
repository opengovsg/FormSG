import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Skeleton } from '@chakra-ui/react'
import { useFeatureIsOn, useGrowthBook } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types/form'
import { FormId } from 'formsg-shared/types/form/form'

import { useUser } from '~features/user/queries'

import { CategoryHeader } from './components/CategoryHeader'
import { WebhooksSection } from './components/WebhooksSection'
import { WebhooksUnsupportedMsg } from './components/WebhooksSection/WebhooksUnsupportedMsg'
import { WebhookV1SchemaInfobox } from './components/WebhooksSection/WebhookV1SchemaInfobox'
import { useAdminFormSettings } from './queries'

export const SettingsWebhooksPage = (): JSX.Element => {
  const gb = useGrowthBook()
  const { data: settings, isLoading } = useAdminFormSettings()
  const userRes = useUser()

  useEffect(() => {
    gb?.setAttributes({
      adminEmail: userRes.user?.email,
    })
  }, [userRes.user?.email, gb])

  const { formId } = useParams()
  const enableMrfWebhooks = useFeatureIsOn(featureFlags.enableMrfWebhooks)
  const isMrfCutoverEnabled = useFeatureIsOn(featureFlags.mrfCutover)

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

  const showV1SchemaInfobox =
    isMrfCutoverEnabled &&
    settings?.responseMode === FormResponseMode.Encrypt &&
    !!formId

  return (
    <Skeleton isLoaded={!isLoading}>
      <CategoryHeader>Webhooks</CategoryHeader>
      {showV1SchemaInfobox && (
        <WebhookV1SchemaInfobox formId={formId as FormId} />
      )}
      <WebhooksSection />
    </Skeleton>
  )
}
