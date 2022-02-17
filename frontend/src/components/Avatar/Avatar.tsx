import {
  Avatar as ChakraAvatar,
  AvatarBadge as ChakraAvatarBadge,
  AvatarProps as ChakraAvatarProps,
} from '@chakra-ui/react'

export interface AvatarProps extends ChakraAvatarProps {
  hasNotification?: boolean
  showBorder?: boolean
}

/*
 * Avatar component
 * May be wrapped in AvatarMenuButton
 */
export const Avatar = ({
  hasNotification,
  showBorder,
  ...rest
}: AvatarProps): JSX.Element => {
  return (
    <ChakraAvatar
      getInitials={
        // Extract first letter of avatar name.
        // Default method extracts first two letters.
        rest.getInitials ? rest.getInitials : (fullName) => fullName[0]
      }
      {...(showBorder
        ? {
            boxShadow: `0 0 0 4px var(--chakra-colors-primary-300)`,
          }
        : {})}
      {...rest}
      aria-label={
        hasNotification ? 'Avatar with unread notifications' : 'Avatar '
      }
    >
      {hasNotification ? <ChakraAvatarBadge /> : null}
    </ChakraAvatar>
  )
}
