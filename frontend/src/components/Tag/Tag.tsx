import React from 'react'
import {
  Tag as ChakraTag,
  TagProps as ChakraTagProps,
  useMultiStyleConfig,
} from '@chakra-ui/react'

import { TagVariants } from '~/theme/components/Tag'

// colorScheme is omitted because the tag uses variants to select colours
export interface TagProps extends Omit<ChakraTagProps, 'colorScheme'> {
  /**
   * The theme of the tag to display
   */
  variant?: TagVariants
}

export const Tag = (props: TagProps): JSX.Element => {
  const style = useMultiStyleConfig('Tag', props)
  return <ChakraTag {...props} sx={style.label} />
}
