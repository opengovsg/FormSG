import { Tag as ChakraTag, TagProps as ChakraTagProps } from '@chakra-ui/react'

import { TagVariants } from '~theme/components/Tag'

export interface TagProps extends ChakraTagProps {
  /**
   * The theme of the tag to display
   */
  variant?: TagVariants
}

export const Tag = (props: TagProps): JSX.Element => {
  return <ChakraTag {...props} />
}
