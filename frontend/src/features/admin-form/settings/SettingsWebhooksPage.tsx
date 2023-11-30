import { FormResponseMode } from '~shared/types/form'

import { CategoryHeader } from './components/CategoryHeader'
import { WebhooksSection } from './components/WebhooksSection'
import { WebhooksUnsupportedMsg } from './components/WebhooksSection/WebhooksUnsupportedMsg'
import { useAdminFormSettings } from './queries'

export const SettingsWebhooksPage = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  // Webhooks are unsupported in email mode; show message.
  if (!isLoading && settings?.responseMode !== FormResponseMode.Encrypt) {
    return <WebhooksUnsupportedMsg responseMode={settings?.responseMode} />
  }

  return (
    <>
      <CategoryHeader>Webhooks</CategoryHeader>
      <WebhooksSection />
    </>
  )
}
