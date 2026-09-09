import { useEffect } from 'react'
import { BiLinkExternal } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'

import { sendDdAction } from '~utils/datadog'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

export type EmptyStatePicker = 'email' | 'dropdown' | 'yesno' | 'fields'

interface FieldEmptyStateProps {
  picker: EmptyStatePicker
  message: string
  actionLabel: string
  onAction: () => void
}

export const FieldEmptyState = ({
  picker,
  message,
  actionLabel,
  onAction,
}: FieldEmptyStateProps): JSX.Element => {
  useEffect(() => {
    void sendDdAction(() => {
      window.DD_RUM?.addAction('workflow_builder.empty_state.shown', {
        picker,
      })
    })
  }, [picker])

  return (
    <InlineMessage variant="info">
      <Stack spacing="0.5rem" flex={1}>
        <Text>{message}</Text>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<BiLinkExternal />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </Stack>
    </InlineMessage>
  )
}
