import { Stack } from '@chakra-ui/react'

import { RetryToggle } from './RetryToggle'
import { WebhookUrlInput } from './WebhookUrlInput'
import { WebhookWorkflowInfobox } from './WebhookWorkflowInfobox'

interface WebhooksSectionProps {
  showWorkflowInfobox: boolean
}

export const WebhooksSection = ({
  showWorkflowInfobox,
}: WebhooksSectionProps): JSX.Element => {
  return (
    <Stack mt="2.5rem" spacing="2.5rem">
      {showWorkflowInfobox && <WebhookWorkflowInfobox />}
      <WebhookUrlInput />
      <RetryToggle />
    </Stack>
  )
}
