import { ChangeEventHandler, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { GUIDE_WEBHOOKS } from '~constants/links'
import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const RetryToggle = (): JSX.Element | null => {
  const { t } = useTranslation()
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
      {...t('features.adminForm.settings.webhooks.retry', {
        returnObjects: true,
        url: GUIDE_WEBHOOKS,
      })}
      onChange={handleToggleRetry}
    />
  )
}
