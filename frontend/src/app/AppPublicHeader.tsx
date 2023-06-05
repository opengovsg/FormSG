import { Link } from 'react-router-dom'
import { Button } from '@chakra-ui/react'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { FORM_GUIDE } from '~constants/links'
import { LOGIN_ROUTE } from '~constants/routes'
import { PublicHeader } from '~templates/PublicHeader'

const PUBLIC_HEADER_LINKS = [
  {
    label: 'Help',
    href: FORM_GUIDE,
    showOnMobile: true,
    MobileIcon: BxsHelpCircle,
  },
]

export const AppPublicHeader = (): JSX.Element => {
  return (
    <PublicHeader
      publicHeaderLinks={PUBLIC_HEADER_LINKS}
      ctaElement={
        <Button
          variant="solid"
          colorScheme="primary"
          as={Link}
          to={LOGIN_ROUTE}
        >
          Log in
        </Button>
      }
    />
  )
}
