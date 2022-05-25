import { BxlFacebook } from '~assets/icons/BxlFacebook'
import { BxlInstagram } from '~assets/icons/BxlInstagram'
import { BxlLinkedin } from '~assets/icons/BxlLinkedin'

import { OgpFullLogo } from './OgpFullLogo'
import { FooterLinkWithIcon } from './types'

export const DEFAULT_FOOTER_ICON_LINK: FooterLinkWithIcon = {
  href: 'https://open.gov.sg',
  label: 'Open Government Products homepage',
  icon: <OgpFullLogo w="183px" />,
}

export const DEFAULT_SOCIAL_MEDIA_LINKS: FooterLinkWithIcon[] = [
  {
    href: 'https://sg.linkedin.com/company/open-government-products',

    icon: <BxlLinkedin />,
    label: 'Go to our LinkedIn page',
  },
  {
    href: 'https://www.facebook.com/opengovsg',
    icon: <BxlFacebook />,
    label: 'Go to our Facebook page',
  },
  {
    href: 'https://www.instagram.com/opengovsg',
    icon: <BxlInstagram />,
    label: 'Go to our Instagram page',
  },
]
