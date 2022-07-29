import { PRIVACY_POLICY_ROUTE, TOU_ROUTE } from './routes'

export const CONTACT_US = 'https://go.gov.sg/formsg-support'
export const FORM_GUIDE = 'https://go.gov.sg/form-guide'
export const REPORT_VULNERABILITY = 'https://go.gov.sg/report-vulnerability'
export const OSS_README =
  'https://s3-ap-southeast-1.amazonaws.com/misc.form.gov.sg/OSS-Legal.pdf'

export const APP_FOOTER_LINKS = [
  { label: 'Contact us', href: CONTACT_US },
  { label: 'Guide', href: FORM_GUIDE },
  { label: 'Privacy', href: PRIVACY_POLICY_ROUTE },
  { label: 'Terms of use', href: TOU_ROUTE },
  {
    label: 'Report vulnerability',
    href: REPORT_VULNERABILITY,
  },
]
