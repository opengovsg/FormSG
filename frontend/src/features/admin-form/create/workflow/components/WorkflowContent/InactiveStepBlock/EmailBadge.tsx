import { Flex } from '@chakra-ui/react'

import Badge, { BadgeProps } from '~components/Badge'

/**
 * Styled badge for displaying emails
 */
export const EmailBadge = (props: BadgeProps) => (
  <Flex>
    <Badge
      maxW="100%"
      variant="subtle"
      colorScheme="secondary"
      whiteSpace="pre-wrap"
      {...props}
    />
  </Flex>
)
