import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { FlexProps } from '@chakra-ui/react'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { FORM_GUIDE } from '~constants/links'
import { LOGIN_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import { PublicHeader } from '~templates/PublicHeader'

interface AppPublicHeaderProps {
  bg?: string
  /**
   * Slim nav, 14px of vertical padding instead of the default 72px on desktop.
   * The V5 landing page uses it; the prototype's nav was 44px tall.
   */
  compact?: boolean
  /** Container overrides, e.g. a page background. Merged over `compact`. */
  containerProps?: FlexProps
}

export const AppPublicHeader = ({
  bg,
  compact,
  containerProps,
}: AppPublicHeaderProps): JSX.Element => {
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
      containerProps={{
        ...(compact ? { py: { base: '0.625rem', md: '0.875rem' } } : {}),
        ...containerProps,
      }}
    />
  )
}
