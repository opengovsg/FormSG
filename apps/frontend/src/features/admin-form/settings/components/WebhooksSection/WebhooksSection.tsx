import { Stack } from '@chakra-ui/react'

import { RetryToggle } from './RetryToggle'
import { WebhookFormatToggle } from './WebhookFormatToggle'
import { WebhookUrlInput } from './WebhookUrlInput'

export const WebhooksSection = (): JSX.Element => {
  return (
    <Stack mt="2.5rem" spacing="2.5rem">
      <WebhookUrlInput />
      <RetryToggle />
      <WebhookFormatToggle />
    </Stack>
  )
}
