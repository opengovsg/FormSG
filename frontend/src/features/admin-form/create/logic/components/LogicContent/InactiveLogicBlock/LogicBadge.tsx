import { Flex } from '@chakra-ui/react'
import { Badge, type BadgeProps } from '@opengovsg/design-system-react'

/**
 * Styled badge for displaying logic values and fields
 */
export const LogicBadge = (props: BadgeProps) => (
  <Flex>
    <Badge
      maxW="100%"
      variant="subtle"
      colorScheme="sub"
      whiteSpace="pre-wrap"
      {...props}
    />
  </Flex>
)
