import { ChangeEventHandler, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'
import { WebhookFormat } from 'formsg-shared/types'

import Toggle from '~components/Toggle'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

export const WebhookFormatToggle = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { data: settings } = useAdminFormSettings()
  const { mutateWebhookFormat } = useMutateFormSettings()
  const isWebhookFormatToggleEnabled = useFeatureIsOn(
    featureFlags.webhookFormatToggle,
  )

  const handleToggleFormat: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (!settings) return
      return mutateWebhookFormat.mutate(
        e.target.checked ? WebhookFormat.V1 : WebhookFormat.V4,
      )
    },
    [mutateWebhookFormat, settings],
  )

  // Gated to whitelisted admins (GrowthBook targeting on the flag), and only
  // relevant once a webhook URL is configured.
  if (!isWebhookFormatToggleEnabled || !settings?.webhook.url) return null

  return (
    <Toggle
      isLoading={mutateWebhookFormat.isLoading}
      isChecked={
        settings.compatibilityOptions?.webhookFormat === WebhookFormat.V1
      }
      label={t('features.adminForm.settings.webhooks.format.label')}
      description={t('features.adminForm.settings.webhooks.format.description')}
      onChange={handleToggleFormat}
    />
  )
}
