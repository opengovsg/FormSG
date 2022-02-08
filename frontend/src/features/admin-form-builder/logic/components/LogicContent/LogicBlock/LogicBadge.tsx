import { Flex } from '@chakra-ui/react'

import Badge, { BadgeProps } from '~components/Badge'

/**
 * Styled badge for displaying logic values and fields
 */
export const LogicBadge = (props: BadgeProps) => (
  <Flex>
    <Badge variant="subtle" colorScheme="secondary" {...props} />
  </Flex>
)
