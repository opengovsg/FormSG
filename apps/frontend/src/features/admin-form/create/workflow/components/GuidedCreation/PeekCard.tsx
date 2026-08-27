import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

export interface PeekCardAction {
  label: string
  onClick: () => void
}

interface PeekCardProps {
  /** What just happened. */
  title: string
  /** What comes next. */
  subtitle?: string
  /**
   * One or two actions, rendered right-aligned with the primary last. Where
   * there are two, the earlier one is a clear-variant secondary.
   *
   * The two-action case is what shapes this API. A single "done" callback
   * cannot express "No, I'm done" beside "Yes, add a step".
   */
  actions: PeekCardAction[]
  /**
   * Tucked beneath the card it reports on, so its top edge is hidden behind
   * that card and it reads as sliding out from underneath.
   *
   * Only looks right directly beneath a card of matching width. Set false for
   * the one moment that follows the end-of-workflow block rather than a card,
   * where it is free-standing.
   */
  isTucked?: boolean
}

/**
 * Acknowledges a card the admin has just finished, and points at what comes
 * next, without taking them out of the workflow.
 *
 * Shares a background with the spotlight and differs only in border weight.
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
          {subtitle && (
            <Text textStyle="body-2" color="secondary.400">
              {subtitle}
            </Text>
          )}
        </Stack>
        <Flex justify="flex-end" gap="0.75rem">
          {actions.map((action, index) => {
            const isPrimary = index === actions.length - 1
            return (
              <Button
                key={action.label}
                variant={isPrimary ? undefined : 'clear'}
                colorScheme={isPrimary ? undefined : 'secondary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          })}
        </Flex>
      </Stack>
    </Box>
  )
}
