import { useEffect } from 'react'
import { Stack } from '@chakra-ui/react'

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
    <Stack spacing="0.5rem">
      <InlineMessage variant="info">{message}</InlineMessage>
      <Button variant="outline" size="sm" w="100%" onClick={onAction}>
        {actionLabel}
      </Button>
    </Stack>
  )
}
