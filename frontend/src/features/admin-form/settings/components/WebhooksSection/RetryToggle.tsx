import { ChangeEventHandler, useCallback } from 'react'

import { GUIDE_WEBHOOKS } from '~constants/links'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const RetryToggle = (): JSX.Element | null => {
  const { data: settings } = useAdminFormSettings()
  const { mutateWebhookRetries } = useMutateFormSettings()

  const handleToggleRetry: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (!settings) return
      return mutateWebhookRetries.mutate(e.target.checked)
    },
    [mutateWebhookRetries, settings],
  )

  if (!settings?.webhook.url) return null

  return (
    <Toggle
      isLoading={mutateWebhookRetries.isLoading}
      isChecked={settings.webhook.isRetryEnabled}
      label="Enable retries"
      description={`Your system must meet certain requirements before retries can be safely enabled. [Learn more](${GUIDE_WEBHOOKS})`}
      onChange={handleToggleRetry}
    />
  )
}
