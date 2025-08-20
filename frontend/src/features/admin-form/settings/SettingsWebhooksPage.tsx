import { useEffect } from 'react'
import { useFeatureIsOn, useGrowthBook } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants'
import { FormResponseMode } from '~shared/types/form'

import { useUser } from '~features/user/queries'

import { CategoryHeader } from './components/CategoryHeader'
import { WebhooksSection } from './components/WebhooksSection'
import { WebhooksUnsupportedMsg } from './components/WebhooksSection/WebhooksUnsupportedMsg'
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

  const enableMrfWebhooks = useFeatureIsOn(featureFlags.enableMrfWebhooks)

  const enableWebhooks =
    !isLoading &&
    (settings?.responseMode == FormResponseMode.Encrypt ||
      (settings?.responseMode === FormResponseMode.Multirespondent &&
        enableMrfWebhooks))

  // Webhooks are only supported in storage mode; show message if form response mode is not storage
  if (!enableWebhooks) {
    return <WebhooksUnsupportedMsg />
  }

  return (
    <>
      <CategoryHeader>Webhooks</CategoryHeader>
      <WebhooksSection />
    </>
  )
}
