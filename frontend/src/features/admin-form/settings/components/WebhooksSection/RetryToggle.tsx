import Toggle from '~components/Toggle'

import { useAdminFormSettings } from '../../queries'

export const RetryToggle = (): JSX.Element | null => {
  const { data: settings } = useAdminFormSettings()

  if (!settings?.webhook.url) return null

  return (
    <Toggle
      // isLoading={mutateWebhookRetry.isLoading}
      isChecked={settings.webhook.isRetryEnabled}
      label="Enable retries"
      description={`Your system must meet certain requirements before retries can be safely enabled.\n\n[Learn more](https://go.gov.sg/form-webhook-retries)`}
      // onChange={() => handleToggleRetry()}
    />
  )
}
