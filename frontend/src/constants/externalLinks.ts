import { PRIVACY_ROUTE, TOU_ROUTE } from './routes'

export const FORM_GUIDE = 'https://go.gov.sg/form-guide'
export const REPORT_VULNERABILITY = 'https://go.gov.sg/report-vulnerability'
export const OSS_README =
  'https://s3-ap-southeast-1.amazonaws.com/misc.form.gov.sg/OSS-Legal.pdf'

export const APP_FOOTER_LINKS = [
  { label: 'Contact Us', href: '/contact-us' },
  { label: 'Guide', href: FORM_GUIDE },
  { label: 'Privacy', href: PRIVACY_ROUTE },
  { label: 'Terms of Use', href: TOU_ROUTE },
  {
    label: 'Report Vulnerability',
    href: REPORT_VULNERABILITY,
  },
]
