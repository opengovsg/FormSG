import { useBreakpointValue } from '@chakra-ui/react'

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
  compactMonochromeLogos,
  containerProps,
  ...footerProps
}: FooterProps): JSX.Element => {
  const isDesktop = useBreakpointValue({ base: false, xs: false, lg: true })

  if (variant === 'compact' && isDesktop) {
    return (
      <CompactFooter
        compactMonochromeLogos={compactMonochromeLogos}
        socialMediaLinks={socialMediaLinks}
        textColorScheme={textColorScheme}
        footerIconLink={footerIconLink}
        containerProps={containerProps}
        {...footerProps}
      />
    )
  }
  return (
    <FullFooter
      socialMediaLinks={socialMediaLinks}
      textColorScheme={textColorScheme}
      containerProps={containerProps}
      footerIconLink={footerIconLink}
      {...footerProps}
    />
  )
}
