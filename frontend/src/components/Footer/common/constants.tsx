import { BxlFacebook } from '~assets/icons/BxlFacebook'
import { BxlInstagram } from '~assets/icons/BxlInstagram'
import { BxlLinkedin } from '~assets/icons/BxlLinkedin'
import { OgpLogoFull } from '~assets/svgrs/brand/OgpFullLogo'

import { FooterLinkWithIcon } from './types'

export const DEFAULT_FOOTER_ICON_LINK: FooterLinkWithIcon = {
  href: 'https://open.gov.sg',
  label: 'Open Government Products homepage',
  Icon: OgpLogoFull,
}

export const DEFAULT_SOCIAL_MEDIA_LINKS: FooterLinkWithIcon[] = [
  {
    href: 'https://sg.linkedin.com/company/open-government-products',
    Icon: BxlLinkedin,
    label: 'Go to our LinkedIn page',
  },
  {
    href: 'https://www.facebook.com/opengovsg',
    Icon: BxlFacebook,
    label: 'Go to our Facebook page',
  },
  {
    href: 'https://www.instagram.com/opengovsg',
    Icon: BxlInstagram,
    label: 'Go to our Instagram page',
  },
]
