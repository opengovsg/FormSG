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
        {/* `h` rather than `minH`: the theme's `sizes.sm` sets only
        `minH: 'auto'`, so Chakra's own `sizes.sm.h` of `2rem` survives the
        `extendTheme` merge and clamps the button. Paired with the theme's
        `whiteSpace: 'pre-wrap'`, a label that wraps renders two 1.5rem lines
        inside a 2rem box and spills past the top and bottom borders, which is
        what these labels do once the card is narrow enough. Releasing the
        height lets the content size the box, as `minH: 'auto'` intended, and
        the single line that results measures 2.75rem: 1.5rem of line box plus
        the base style's 9px padding and 1px borders. That is also the touch
        target this wants on a phone. */}
        <Button
          variant="outline"
          size="sm"
          h="auto"
          leftIcon={<BiLinkExternal />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </Stack>
    </InlineMessage>
  )
}
