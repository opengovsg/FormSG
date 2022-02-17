import {
  Avatar as ChakraAvatar,
  AvatarBadge as ChakraAvatarBadge,
  AvatarProps as ChakraAvatarProps,
} from '@chakra-ui/react'

export interface AvatarProps extends ChakraAvatarProps {
  hasNotification?: boolean
}

/*
 * Avatar component
 * May be wrapped in AvatarMenuButton
 */
export const Avatar = ({
  hasNotification,
  ...rest
}: AvatarProps): JSX.Element => {
  return (
    <ChakraAvatar
      getInitials={
        // Extract first letter of avatar name.
        // Default method extracts first two letters.
        rest.getInitials ? rest.getInitials : (fullName) => fullName[0]
      }
      {...rest}
    >
      {hasNotification ? <ChakraAvatarBadge /> : null}
    </ChakraAvatar>
  )
}
