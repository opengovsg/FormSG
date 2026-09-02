import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

export interface PeekCardAction {
  label: string
  onClick: () => void
}

export interface PeekCardProps {
  /** What just happened. Required: a peek card always names a completion. */
  title: string
  /** What comes next. */
  subtitle?: string
  /**
   * One or two actions, right-aligned with the primary last. Where there are
   * two, the earlier is a clear-variant secondary.
   *
   * An array rather than a single `onDone` callback because the two-action case
   * is the one that shapes this API: "No, I'm done" beside "Yes, add a step"
   * cannot be expressed by one callback.
   */
  actions: PeekCardAction[]
  /**
   * Tucked beneath the card it reports on, so its top edge is hidden behind
   * that card and it reads as sliding out from underneath.
   *
   * Only looks right directly beneath a card of matching width; anywhere else
   * it reads as a floating tab. Set false for a free-standing card, which is
   * the moment that follows the end-of-workflow block rather than a card.
   */
  isTucked?: boolean
}

/**
 * Acknowledges a card the admin has just finished and points at what comes
 * next, without taking them out of the workflow.
 *
 * Presentational only: it takes resolved copy and callbacks, and holds no
 * feature flag, store or translation of its own. Which moment is being reported
 * and whether one should render at all belong to the caller.
 *
 * Shares `primary.100` with the spotlight and differs only in border weight.
 * The spotlight means "act here"; this reports what happened. That is the
 * thinnest distinction in the system, so neither should move toward the other.
 */
export const PeekCard = ({
  title,
  subtitle,
  actions,
  isTucked = true,
}: PeekCardProps): JSX.Element => {
  return (
    <Box
      bg="primary.100"
      // Flat top plus a negative margin is what hides the top edge behind the
      // card above. The bottom radius is constant, so only the top varies.
      borderTopRadius={isTucked ? '0' : '8px'}
      borderBottomRadius="8px"
      border="1px solid"
      borderColor="primary.200"
      mt={isTucked ? '-0.5rem' : undefined}
      py="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
    >
      <Stack spacing="1rem">
        <Stack spacing="0.25rem">
          <Text textStyle="subhead-1" color="secondary.500">
            {title}
          </Text>
          {subtitle ? (
            <Text textStyle="body-2" color="secondary.400">
              {subtitle}
            </Text>
          ) : null}
        </Stack>
        <Flex justify="flex-end" gap="0.75rem">
          {actions.map((action, index) => (
            // Primary is last, so index position decides the treatment rather
            // than a per-action flag the caller could set inconsistently.
            <Button
              key={action.label}
              variant={index === actions.length - 1 ? undefined : 'clear'}
              colorScheme={
                index === actions.length - 1 ? undefined : 'secondary'
              }
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Flex>
      </Stack>
    </Box>
  )
}
