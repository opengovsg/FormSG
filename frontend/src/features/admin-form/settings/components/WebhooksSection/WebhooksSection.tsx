import { Stack } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types/form'

import InlineMessage from '~components/InlineMessage'

import { useAdminFormSettings } from '../../queries'

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
    <Stack>
      <WebhookUrlInput />
    </Stack>
  )
}
