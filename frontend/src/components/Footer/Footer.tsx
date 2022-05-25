import { useIsMobile } from '~hooks/useIsMobile'

import {
  DEFAULT_FOOTER_ICON_LINK,
  DEFAULT_SOCIAL_MEDIA_LINKS,
} from './common/constants'
import { FooterProps } from './common/types'
import { CompactFooter } from './CompactFooter'
import { FullFooter } from './FullFooter'

export const Footer = ({
  variant = 'full',
  footerIconLink = DEFAULT_FOOTER_ICON_LINK,
  socialMediaLinks = DEFAULT_SOCIAL_MEDIA_LINKS,
  textColorScheme = 'secondary',
  bg = 'primary.100',
  ...footerProps
}: FooterProps): JSX.Element => {
  const isMobile = useIsMobile()

  if (variant === 'compact' && !isMobile) {
    return (
      <CompactFooter
        socialMediaLinks={socialMediaLinks}
        textColorScheme={textColorScheme}
        bg={bg}
        footerIconLink={footerIconLink}
        {...footerProps}
      />
    )
  }
  return (
    <FullFooter
      socialMediaLinks={socialMediaLinks}
      textColorScheme={textColorScheme}
      bg={bg}
      footerIconLink={footerIconLink}
      {...footerProps}
    />
  )
}
