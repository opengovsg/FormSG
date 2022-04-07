import { CategoryHeader } from './components/CategoryHeader'
import { WebhooksSection } from './components/WebhooksSection'

export const SettingsWebhooksPage = (): JSX.Element => {
  return (
    <>
      <CategoryHeader>Webhooks</CategoryHeader>
      <WebhooksSection />
    </>
  )
}
