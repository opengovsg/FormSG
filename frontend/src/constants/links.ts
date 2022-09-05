import { PRIVACY_POLICY_ROUTE, TOU_ROUTE } from './routes'

export const CONTACT_US = 'https://go.gov.sg/formsg-support'
export const FEATURE_REQUEST = 'https://go.gov.sg/form-featurerequest'
export const REPORT_VULNERABILITY = 'https://go.gov.sg/report-vulnerability'
export const OSS_README =
  'https://s3-ap-southeast-1.amazonaws.com/misc.form.gov.sg/OSS-Legal.pdf'

export const SINGPASS_FAQ = 'https://www.singpass.gov.sg/main/html/faq.html'

// FormSG guide links
export const FORM_GUIDE = 'https://go.gov.sg/form-guide'
export const GUIDE_WEBHOOKS =
  'https://guide.form.gov.sg/AdvancedGuide.html#webhooks'
export const GUIDE_EMAIL_MODE =
  'https://guide.form.gov.sg/AdvancedGuide.html#email-mode'
export const GUIDE_STORAGE_MODE = 'https://go.gov.sg/form-what-is-storage-mode'
export const GUIDE_FORM_LOGIC =
  'https://guide.form.gov.sg/AdvancedGuide.html#form-logic'
export const GUIDE_SPCP_ESRVCID =
  'https://guide.form.gov.sg/AdvancedGuide.html#singpass-corppass-and-myinfo'
export const GUIDE_ENABLE_SPCP =
  'https://guide.form.gov.sg/AdvancedGuide.html#how-do-you-enable-singpass-or-corppass'
export const GUIDE_TWILIO =
  'https://guide.form.gov.sg/AdvancedGuide.html#how-do-i-arrange-payment-for-verified-sms'
export const GUIDE_ATTACHMENT_SIZE_LIMIT =
  'https://guide.form.gov.sg/AdvancedGuide.html#how-do-i-increase-attachment-size-limit-and-what-if-there-are-many-attachments-for-my-form'
export const GUIDE_E2EE =
  'https://guide.form.gov.sg/AdvancedGuide.html#how-does-end-to-end-encryption-work'
export const GUIDE_TRANSFER_OWNERSHIP =
  'https://guide.form.gov.sg/AdvancedGuide.html#i-am-leaving-the-organisation-or-switching-over-to-a-new-email-how-do-i-transfer-ownership-of-my-forms'
export const GUIDE_SECRET_KEY_LOSS = 'https://go.gov.sg/secretkeyloss'
export const GUIDE_PREVENT_EMAIL_BOUNCE =
  'https://go.gov.sg/form-prevent-bounce'
export const GUIDE_EMAIL_RELIABILITY =
  'https://go.gov.sg/form-email-reliability'

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
    href: 'https://form.gov.sg/6162b3c7ed9ee00013726baf',
    label: 'Covid Positive Patient Details',
  },
  {
    href: 'https://form.gov.sg/5eb38e989bd7d80011066a02',
    label: 'Daily Reporting Health Symptoms',
  },
  {
    href: 'https://form.gov.sg/5f085b4b3583420013af9a55',
    label: 'Health and Travel Declaration Form',
  },
  {
    href: 'https://form.gov.sg/6057667b248bbc0012ceda2f',
    label: 'Gov.sg WhatsApp Subscription',
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
