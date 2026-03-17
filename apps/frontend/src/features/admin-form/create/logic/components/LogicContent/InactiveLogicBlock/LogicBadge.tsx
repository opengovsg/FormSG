import { Flex } from '@chakra-ui/react'

import Badge, { BadgeProps } from '~components/Badge'

/**
 * Styled badge for displaying logic values and fields
 */
export const LogicBadge = (props: BadgeProps) => {
  const { colorScheme, ...rest } = props
  return (
    <Flex maxW="100%">
      <Badge
        maxW="100%"
        variant="subtle"
        colorScheme={colorScheme ?? 'secondary'}
        whiteSpace="pre-wrap"
        {...rest}
      />
    </Flex>
  )
}
