import { BiLogOutCircle } from 'react-icons/bi'
import { Box } from '@chakra-ui/react'

import Button from '~components/Button'

import { FormBannerLogoProps } from './FormBannerLogo'

export interface FormLogoutButtonProps
  extends Pick<FormBannerLogoProps, 'loggedInId'> {
  onLogout?: () => void
}

export const FormLogoutButton = ({
  loggedInId,
  onLogout,
}: FormLogoutButtonProps): JSX.Element | null => {
  if (!loggedInId) {
    return null
  }

  return (
    <Box alignSelf="center" justifySelf="flex-end">
      <Button
        variant="clear"
        rightIcon={<BiLogOutCircle fontSize="1.5rem" />}
        onClick={onLogout}
      >
        {loggedInId} - Sign out
      </Button>
    </Box>
  )
}
