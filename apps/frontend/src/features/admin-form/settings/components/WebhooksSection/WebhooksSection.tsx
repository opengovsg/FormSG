import { useTranslation } from 'react-i18next'
import { Skeleton, Stack } from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import {
  featureFlags,
  PLUMBER_WEBHOOK_URL_REGEX,
} from 'formsg-shared/constants'
import { FormResponseMode } from 'formsg-shared/types'

import { OGP_PLUMBER } from '~constants/links'
import InlineMessage from '~components/InlineMessage'
import Toggle from '~components/Toggle'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useMutateFormSettings } from '../../mutations'
import { useAdminFormSettings } from '../../queries'

import { RetryToggle } from './RetryToggle'
import { WebhooksErrorMsg } from './WebhooksErrorMsg'
import { WebhookUrlInput } from './WebhookUrlInput'

export const WebhooksSection = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings } = useAdminFormSettings()
  const v4Enabled = useFeatureIsOn(featureFlags.mrfWebhooksV4)
  const { mutateWebhookFormat } = useMutateFormSettings()
  const isMrf = settings?.responseMode === FormResponseMode.Multirespondent
  const isFormLoadRequired = isMrf
  const {
    data: form,
    isLoading,
    isError,
    isRefetching,
    refetch,
  } = useAdminForm({
    enabled: isFormLoadRequired,
    staleTime: 0,
  })
  if (isFormLoadRequired && isError) {
    return <WebhooksErrorMsg onRetry={refetch} isRetrying={isRefetching} />
  }

  const hasMultipleSteps =
    isMrf &&
    form?.responseMode === FormResponseMode.Multirespondent &&
    form.workflow.length >= 2

  const isPlumber = PLUMBER_WEBHOOK_URL_REGEX.test(settings?.webhook.url ?? '')
  const effectiveFormat =
    settings?.webhook.webhookFormat ??
    (v4Enabled && !settings?.webhook.url ? 'v4' : 'v1')
  // Plumber keeps the pre-V4 multi-step lock while the rollout is off.
  const isWorkflowUnsupported =
    hasMultipleSteps && (isPlumber ? !v4Enabled : effectiveFormat === 'v1')

  return (
    <Skeleton isLoaded={!isFormLoadRequired || !isLoading}>
      <Stack mt="2.5rem" spacing="2.5rem">
        {isWorkflowUnsupported && (
          <InlineMessage variant="info" useMarkdown>
            {t(
              v4Enabled
                ? 'features.adminForm.settings.webhooks.legacyWorkflowUnsupported'
                : 'features.adminForm.settings.webhooks.workflowUnsupported',
              {
                plumberUrl: OGP_PLUMBER,
              },
            )}
          </InlineMessage>
        )}
        <WebhookUrlInput
          isDisabled={isMrf && (!form || isWorkflowUnsupported)}
          canRemove={hasMultipleSteps}
        />
        <RetryToggle />
        {isMrf &&
          !isPlumber &&
          (v4Enabled || settings?.webhook.webhookFormat === 'v4') && (
            <Toggle
              label={t('features.adminForm.settings.webhooks.legacy.label')}
              description={t(
                'features.adminForm.settings.webhooks.legacy.description',
              )}
              isChecked={settings?.webhook.webhookFormat === 'v1'}
              isDisabled={
                hasMultipleSteps && settings?.webhook.webhookFormat !== 'v1'
              }
              isLoading={mutateWebhookFormat.isLoading}
              onChange={(event) =>
                mutateWebhookFormat.mutate(event.target.checked ? 'v1' : 'v4')
              }
            />
          )}
      </Stack>
    </Skeleton>
  )
}
