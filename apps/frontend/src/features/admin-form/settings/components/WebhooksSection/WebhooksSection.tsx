import { Stack } from '@chakra-ui/react'

import { RetryToggle } from './RetryToggle'
import { WebhookUrlInput } from './WebhookUrlInput'
import { WebhookWorkflowInfobox } from './WebhookWorkflowInfobox'

export const WebhooksSection = (): JSX.Element => {
  return (
    <Stack mt="2.5rem" spacing="2.5rem">
      <WebhookWorkflowInfobox />
      <WebhookUrlInput />
      <RetryToggle />
    </Stack>
  )
}
