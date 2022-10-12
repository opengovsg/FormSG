import { PRIVACY_POLICY_ROUTE, TOU_ROUTE } from './routes'

export const CONTACT_US = 'https://go.gov.sg/formsg-support'
export const FEATURE_REQUEST = 'https://go.gov.sg/form-featurerequest'
export const REPORT_VULNERABILITY = 'https://go.gov.sg/report-vulnerability'
export const OSS_README =
  'https://s3-ap-southeast-1.amazonaws.com/misc.form.gov.sg/OSS-Legal.pdf'

export const SINGPASS_FAQ = 'https://www.singpass.gov.sg/main/html/faq.html'

// FormSG guide links
export const FORM_GUIDE = 'https://go.gov.sg/formsg-guides'
export const GUIDE_WEBHOOKS = 'https://go.gov.sg/formsg-guide-webhooks'
export const GUIDE_EMAIL_MODE = 'https://go.gov.sg/formsg-guide-email-mode'
export const GUIDE_STORAGE_MODE = 'https://go.gov.sg/formsg-guide-storage-mode'
export const GUIDE_FORM_LOGIC = 'https://go.gov.sg/formsg-guide-logic'
export const GUIDE_SPCP_ESRVCID =
  'https://go.gov.sg/formsg-guide-singpass-myinfo'
export const GUIDE_ENABLE_SPCP =
  'https://go.gov.sg/formsg-guide-singpass-myinfo-enable'
export const GUIDE_TWILIO = 'https://go.gov.sg/formsg-guide-verified-smses'
export const GUIDE_ATTACHMENT_SIZE_LIMIT =
  'https://go.gov.sg/formsg-guide-attachment-size-increase'
export const GUIDE_E2EE = 'https://go.gov.sg/formsg-guide-e2e'
export const GUIDE_TRANSFER_OWNERSHIP =
  'https://go.gov.sg/formsg-guide-transfer-ownership'
export const GUIDE_SECRET_KEY_LOSS =
  'https://go.gov.sg/formsg-guide-secret-key-loss'
export const GUIDE_PREVENT_EMAIL_BOUNCE =
  'https://go.gov.sg/formsg-guide-email-bounce'
export const GUIDE_EMAIL_RELIABILITY =
  'https://go.gov.sg/formsg-guide-email-reliability'
export const GUIDE_PREFILL = 'https://go.gov.sg/formsg-guide-prefills'

export const ACCEPTED_FILETYPES_SPREADSHEET = 'https://go.gov.sg/formsg-cwl'

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

export const LANDING_PAGE_EXAMPLE_FORMS = [
  {
    href: 'https://form.gov.sg/600c490b7c026600138d4ca9',
    label: 'Register for COVID-19 Vaccination',
  },
  {
    href: 'https://form.gov.sg/5eb38e989bd7d80011066a02',
    label: 'Daily Reporting Health Symptoms',
  },
  {
    href: 'https://form.gov.sg/6057667b248bbc0012ceda2f',
    label: 'Gov.sg WhatsApp Subscription',
  },
  {
    href: 'https://form.gov.sg/6041e9f8bd47260012395250',
    label: 'Post-ICT Survey',
  },
  {
    href: 'https://form.gov.sg/5f085b4b3583420013af9a55',
    label: 'Health and Travel Declaration Form',
  },
  {
    href: 'https://form.gov.sg/60b81af0f7c4df001210f2b3',
    label: 'MOM ART Self Swab',
  },
]

export const OGP_ALL_PRODUCTS = 'https://www.open.gov.sg/products/overview'
export const OGP_POSTMAN = 'https://postman.gov.sg'
export const OGP_FORMSG_COLLATE = 'https://collate.form.gov.sg'
export const OGP_SGID = 'https://go.gov.sg/sgid-formsg'

export const OGP_FORMSG_REPO = 'https://github.com/opengovsg/formsg'
