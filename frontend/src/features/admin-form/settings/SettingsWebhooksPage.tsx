import { FormResponseMode } from '~shared/types/form'

import { CategoryHeader } from './components/CategoryHeader'
import { WebhooksSection } from './components/WebhooksSection'
import { WebhooksUnsupportedMsg } from './components/WebhooksSection/WebhooksUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsWebhooksPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  // Webhooks are only supported in storage mode; show message if form response mode is not storage
  if (!isLoading && settings?.responseMode !== FormResponseMode.Encrypt) {
    return <WebhooksUnsupportedMsg />
  }

  return (
    <>
      <CategoryHeader>Webhooks</CategoryHeader>
      <WebhooksSection />
    </>
  )
}
