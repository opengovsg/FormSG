import { Stack } from '@chakra-ui/react'

import { RetryToggle } from './RetryToggle'
import { WebhookUrlInput } from './WebhookUrlInput'

export const WebhooksSection = (): JSX.Element => {
  return (
    <Stack spacing="2.5rem">
      <WebhookUrlInput />
      <RetryToggle />
    </Stack>
  )
}
