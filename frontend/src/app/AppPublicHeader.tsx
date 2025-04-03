import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { FORM_GUIDE } from '~constants/links'
import { LOGIN_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import { PublicHeader } from '~templates/PublicHeader'

export const AppPublicHeader = ({ bg }: { bg?: string }): JSX.Element => {
  const { t } = useTranslation()

  const publicHeaderLinks = [
    {
      label: t('features.app.publicHeaderLinkLabel.formGuide'),
      href: FORM_GUIDE,
      showOnMobile: true,
      MobileIcon: BxsHelpCircle,
    },
  ]

  return (
    <PublicHeader
      publicHeaderLinks={publicHeaderLinks}
      ctaElement={
        <Button
          variant={bg ? 'inverseOutline' : 'solid'}
          basecolorintensity={500}
          colorScheme="primary"
          as={Link}
          to={LOGIN_ROUTE}
        >
          {t('features.app.ctaButton.login')}
        </Button>
      }
      bg={bg}
    />
  )
}
