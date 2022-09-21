import { BiLogOutCircle } from 'react-icons/bi'
import { Box } from '@chakra-ui/react'

import { ThemeColorScheme } from '~theme/foundations/colours'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import IconButton from '~components/IconButton'

import { FormBannerLogoProps } from './FormBannerLogo'

export interface FormLogoutButtonProps
  extends Pick<FormBannerLogoProps, 'loggedInId'> {
  onLogout: (() => void) | undefined
  colorScheme: ThemeColorScheme
}

export const FormLogoutButton = ({
  loggedInId,
  onLogout,
  colorScheme,
}: FormLogoutButtonProps): JSX.Element | null => {
  const isMobile = useIsMobile()

  if (!loggedInId) {
    return null
  }

  return (
    <Box alignSelf="center" justifySelf="flex-end">
      {isMobile ? (
        <IconButton
          colorScheme={colorScheme}
          variant="clear"
          icon={<BiLogOutCircle fontSize="1.5rem" />}
          aria-label="Sign out"
        />
      ) : (
        <Button
          isDisabled={!onLogout}
          colorScheme={colorScheme}
          variant="clear"
          rightIcon={<BiLogOutCircle fontSize="1.5rem" />}
          onClick={onLogout}
        >
          {loggedInId} - Sign out
        </Button>
      )}
    </Box>
  )
}
