import { Stack } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form'

import InlineMessage from '~components/InlineMessage'

import { useAdminFormSettings } from '../../queries'

import { RetryToggle } from './RetryToggle'
import { WebhookUrlInput } from './WebhookUrlInput'

export const WebhooksSection = (): JSX.Element => {
  const { data: settings, isLoading } = useAdminFormSettings()

  if (!isLoading && settings?.responseMode !== FormResponseMode.Encrypt) {
    return (
      <InlineMessage>
        Webhooks are only available in storage mode forms.
      </InlineMessage>
    )
  }

  return (
    <Stack spacing="2.5rem">
      <WebhookUrlInput />
      <RetryToggle />
    </Stack>
  )
}
