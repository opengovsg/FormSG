import { GovtMasthead } from './index'

export const enSG: GovtMasthead = {
  aria: {
    expandLabel:
      'Expand masthead to find out how to identify an official government website',
    collapseLabel: 'Collapse masthead',
  },
  mainText:
    'A Singapore Government Agency Website. Beware of government impersonation scams.',
  howToIdentify: 'How to identify',
  officialWebsiteLinks: {
    header: 'Official website links end with .gov.sg',
    description:
      'Government agencies communicate via <bold>.gov.sg</bold> websites (e.g. go.gov.sg/open).',
    trustedWebsitesLink: {
      text: 'Trusted websites',
      ariaLabel: 'Click to open a list of trusted sites in a new window',
    },
  },
  secureWebsites: {
    header: 'Secure websites use HTTPS',
    description:
      'or https:// as an added precaution. Share sensitive information only on official, secure websites.',
  },
  scamAlert: {
    header: 'Scam alert',
    description:
      'Government officers will never ask you to send money or share your details over the phone. <bold>When unsure, hang up and call Scamshield at 1799.</bold>',
  },
}
