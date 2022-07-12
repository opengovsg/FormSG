import { ComponentMultiStyleConfig } from '@chakra-ui/react'

export const AvatarMenu: ComponentMultiStyleConfig = {
  parts: ['usernameItem', 'usernameIcon'],
  baseStyle: {
    usernameItem: {
      display: 'flex',
      alignItems: 'center',
      py: '0.5rem',
      px: '1rem',
      fontWeight: '500',
    },
    usernameIcon: {
      w: '1.25rem',
      h: '1.25rem',
      mr: '1rem',
    },
  },
}
