import { GOGOV_BASE_URL } from '~shared/constants'

import { PRIVACY_POLICY_ROUTE, TOU_ROUTE } from './routes'

export const CONTACT_US = `${GOGOV_BASE_URL}/formsg-support`
export const FEATURE_REQUEST = `${GOGOV_BASE_URL}/form-featurerequest`
export const REPORT_VULNERABILITY = `${GOGOV_BASE_URL}/report-vulnerability`
export const OSS_README = `${GOGOV_BASE_URL}/formsg-thirdparty'`

export const SINGPASS_FAQ = 'https://www.singpass.gov.sg/main/html/faq.html'

// FormSG guide links
export const FORM_GUIDE = `${GOGOV_BASE_URL}/formsg-guides`
export const GUIDE_WEBHOOKS = `${GOGOV_BASE_URL}/formsg-guide-webhooks`
export const GUIDE_EMAIL_MODE = `${GOGOV_BASE_URL}/formsg-guide-email-mode`
export const GUIDE_STORAGE_MODE = `${GOGOV_BASE_URL}/formsg-guide-storage-mode`
export const GUIDE_FORM_LOGIC = `${GOGOV_BASE_URL}/formsg-guide-logic`
export const GUIDE_FORM_MRF = `${GOGOV_BASE_URL}/formsg-guide-mrf`
export const GUIDE_MRF_MODE = 'http://go.gov.sg/formsg-mrf'
export const GUIDE_SPCP_ESRVCID = `${GOGOV_BASE_URL}/formsg-guide-singpass-myinfo`
export const GUIDE_ENABLE_SPCP = `${GOGOV_BASE_URL}/formsg-guide-singpass-myinfo-enable`
export const GUIDE_TWILIO = `${GOGOV_BASE_URL}/formsg-guide-verified-smses`
export const GUIDE_ATTACHMENT_SIZE_LIMIT = `${GOGOV_BASE_URL}/formsg-guide-attachment-size-increase`
export const GUIDE_E2EE = `${GOGOV_BASE_URL}/formsg-guide-e2e`
export const GUIDE_TRANSFER_OWNERSHIP = `${GOGOV_BASE_URL}/formsg-guide-transfer-ownership`
export const GUIDE_SECRET_KEY_LOSS = `${GOGOV_BASE_URL}/formsg-guide-secret-key-loss`
export const GUIDE_PREVENT_EMAIL_BOUNCE = `${GOGOV_BASE_URL}/formsg-guide-email-bounce`
export const GUIDE_EMAIL_RELIABILITY = `${GOGOV_BASE_URL}/formsg-guide-email-reliability`
export const GUIDE_PREFILL = `${GOGOV_BASE_URL}/formsg-guide-prefills`
export const GUIDE_STRIPE_ONBOARDING = `${GOGOV_BASE_URL}/formsg-payments`
export const GUIDE_PAYMENTS_ENTRY = `${GOGOV_BASE_URL}/formsg-payment-overview`
export const GUIDE_PAYMENTS_INVOICE_DIFFERENCES = `${GOGOV_BASE_URL}/formsg-payments-invoice-differences`
export const GUIDE_ENCRYPTION_BOUNDARY_SHIFT =
  'https://guide.form.gov.sg/faq/faq/storage-mode-virus-scanning-and-content-validation'
export const ACCEPTED_FILETYPES_SPREADSHEET = `${GOGOV_BASE_URL}/formsg-cwl`

export const APP_FOOTER_LINKS = [
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
export const OGP_PLUMBER = 'https://plumber.gov.sg/'
export const OGP_SGID = `${GOGOV_BASE_URL}/sgid-formsg`

export const OGP_FORMSG_REPO = 'https://github.com/opengovsg/formsg'

export const FORMSG_UAT = 'https://uat.form.gov.sg'

export const GROWTHBOOK_DEV_PROXY =
  'https://proxy-growthbook-stg.formsg.workers.dev'
