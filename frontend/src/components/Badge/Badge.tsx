import {
  Badge as ChakraBadge,
  BadgeProps as ChakraBadgeProps,
} from '@chakra-ui/react'

import { TagVariants } from '~theme/components/Tag'

export interface BadgeProps extends ChakraBadgeProps {
  /**
   * The theme of the tag to display
   */
  variant?: TagVariants
}

export const Badge = (props: BadgeProps): JSX.Element => {
  return <ChakraBadge {...props} />
}
