import { useEffect } from 'react'
import { BiLinkExternal } from 'react-icons/bi'
import { Stack, Text } from '@chakra-ui/react'

import { sendDdAction } from '~utils/datadog'
import Button from '~components/Button'
import InlineMessage from '~components/InlineMessage'

export type EmptyStatePicker = 'email' | 'dropdown' | 'yesno' | 'fields'

interface FieldEmptyStateProps {
  /** Which picker is empty. Sent as the instrumentation dimension. */
  picker: EmptyStatePicker
  message: string
  actionLabel: string
  onAction: () => void
}

/**
 * Shown in place of a picker whose options all come from the form's own
 * fields, when the form has none of the right type. Props only, so the
 * guided flow can reuse it without inheriting this tree's context.
 */
export const FieldEmptyState = ({
  picker,
  message,
  actionLabel,
  onAction,
}: FieldEmptyStateProps): JSX.Element => {
  useEffect(() => {
    // sendDdAction, not the datadogRum proxy: the proxy binds window.DD_RUM at
    // module load and silently drops actions when the datadog chunk lands
    // after the app bundle. This fires on mount, which is when that happens.
    void sendDdAction(() => {
      window.DD_RUM?.addAction('workflow_builder.empty_state.shown', {
        picker,
      })
    })
  }, [picker])

  return (
    <InlineMessage variant="info">
      {/* flex=1: claim the row beside the icon so the button spans the box */}
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
