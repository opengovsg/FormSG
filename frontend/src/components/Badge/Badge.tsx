import {
  Badge as ChakraBadge,
  BadgeProps as ChakraBadgeProps,
} from '@chakra-ui/react'

import { BadgeVariants } from '~theme/components/Badge'

export interface BadgeProps extends ChakraBadgeProps {
  /**
   * The theme of the tag to display
   */
  variant?: BadgeVariants
  bgColor?: string
}

export const Badge = (props: BadgeProps): JSX.Element => {
  return <ChakraBadge {...props} />
}
