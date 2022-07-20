import { ComponentMultiStyleConfig } from '@chakra-ui/react'
import { anatomy, PartsStyleFunction } from '@chakra-ui/theme-tools'

const parts = anatomy('avatarMenu').parts(
  'avatar',
  'usernameItem',
  'usernameIcon',
)

const baseStyle: PartsStyleFunction<typeof parts> = ({ colorScheme: c }) => {
  const focusBoxShadow = `0 0 0 4px var(--chakra-colors-${c}-300)`

  return {
    avatar: {
      bg: `${c}.500`,
      _groupFocus: {
        boxShadow: focusBoxShadow,
      },
      _groupHover: {
        bg: `${c}.600`,
      },
      transitionProperty: 'common',
      transitionDuration: 'normal',
    },
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
  }
}

export const AvatarMenu: ComponentMultiStyleConfig = {
  parts: parts.keys,
  baseStyle,
  defaultProps: {
    colorScheme: 'primary',
  },
}
