import { useTranslation } from 'react-i18next'
import { Skeleton, Stack } from '@chakra-ui/react'

import { FormResponseMode } from 'formsg-shared/types'

import { OGP_PLUMBER } from '~constants/links'
import InlineMessage from '~components/InlineMessage'

import { useAdminForm } from '~features/admin-form/common/queries'

import { useAdminFormSettings } from '../../queries'

import { RetryToggle } from './RetryToggle'
import { WebhooksErrorMsg } from './WebhooksErrorMsg'
import { WebhookUrlInput } from './WebhookUrlInput'

export const WebhooksSection = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings } = useAdminFormSettings()
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

  return (
    <Skeleton isLoaded={!isFormLoadRequired || !isLoading}>
      <Stack mt="2.5rem" spacing="2.5rem">
        {hasMultipleSteps && (
          <InlineMessage variant="info" useMarkdown>
            {t('features.adminForm.settings.webhooks.workflowUnsupported', {
              plumberUrl: OGP_PLUMBER,
            })}
          </InlineMessage>
        )}
        <WebhookUrlInput
          isDisabled={isMrf && (!form || hasMultipleSteps)}
          canRemove={hasMultipleSteps}
        />
        <RetryToggle />
      </Stack>
    </Skeleton>
  )
}
