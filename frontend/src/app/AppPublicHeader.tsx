import { Link } from 'react-router-dom'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { FORM_GUIDE } from '~constants/links'
import { LOGIN_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import { PublicHeader } from '~templates/PublicHeader'

const PUBLIC_HEADER_LINKS = [
  {
    label: 'Help',
    href: FORM_GUIDE,
    showOnMobile: true,
    MobileIcon: BxsHelpCircle,
  },
]

export const AppPublicHeader = ({ bg }: { bg?: string }): JSX.Element => {
  return (
    <PublicHeader
      publicHeaderLinks={PUBLIC_HEADER_LINKS}
      ctaElement={
        <Button
          variant={bg ? 'inverseOutline' : 'solid'}
          basecolorintensity={500}
          colorScheme="primary"
          as={Link}
          to={LOGIN_ROUTE}
        >
          Log in
        </Button>
      }
      bg={bg}
    />
  )
}
