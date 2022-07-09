import { ComponentMultiStyleConfig } from '@chakra-ui/react'

import { textStyles } from '~theme/textStyles'

export const Avatar: ComponentMultiStyleConfig = {
  parts: ['container', 'badge', 'usernameItem', 'usernameIcon'],
  sizes: {
    md: {
      container: {
        width: '2.5rem',
        height: '2.5rem',
      },
      label: textStyles['subhead-2'],
    },
  },
  baseStyle: {
    container: {
      backgroundColor: 'primary.500',
      fontStyle: 'subhead-2',
      color: 'white',
    },
    badge: {
      borderColor: 'white',
      bg: 'danger.500',
      width: '0.55rem',
      height: '0.55rem',
      borderWidth: '0.0625rem',
      position: 'absolute',
      top: '2.125rem',
      left: '2.125rem',
    },
  },
  defaultProps: {
    size: 'md',
  },
}
