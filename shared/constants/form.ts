const PUBLIC_FORM_FIELDS = [
  'admin',
  'authType',
  'isSubmitterIdCollectionEnabled',
  'isSingleSubmission',
  'endPage',
  'esrvcId',
  'form_fields',
  'form_logics',
  'hasCaptcha',
  'hasIssueNotification',
  'startPage',
  'status',
  'title',
  '_id',
  'responseMode',
] as const

export const EMAIL_PUBLIC_FORM_FIELDS = PUBLIC_FORM_FIELDS
export const STORAGE_PUBLIC_FORM_FIELDS = [
  ...PUBLIC_FORM_FIELDS,
  'payments_field',
  'publicKey',
  'whitelistedSubmitterIds',
] as const

export const MULTIRESPONDENT_PUBLIC_FORM_FIELDS = [
  ...PUBLIC_FORM_FIELDS,
  'publicKey',
  'workflow',
] as const

const FORM_SETTINGS_FIELDS = [
  'responseMode',
  'authType',
  'isSubmitterIdCollectionEnabled',
  'isSingleSubmission',
  'esrvcId',
  'hasCaptcha',
  'hasIssueNotification',
  'inactiveMessage',
  'status',
  'submissionLimit',
  'title',
  'webhook',
] as const

export const EMAIL_FORM_SETTINGS_FIELDS = [
  ...FORM_SETTINGS_FIELDS,
  'emails',
] as const
export const STORAGE_FORM_SETTINGS_FIELDS = [
  ...FORM_SETTINGS_FIELDS,
  'payments_channel',
  'payments_field',
  'publicKey',
  'business',
  'emails',
  'whitelistedSubmitterIds',
] as const

export const MULTIRESPONDENT_FORM_SETTINGS_FIELDS = [
  ...FORM_SETTINGS_FIELDS,
  'publicKey',
  'emails',
  'stepsToNotify',
  'stepOneEmailNotificationFieldId',
] as const

// Fields that are necessary for decrypting the cipherTexts given peer's private key
export const WHITELISTED_SUBMITTER_ID_DECRYPTION_FIELDS = [
  'myPublicKey',
  'nonce',
  'cipherTexts',
] as const

export const WEBHOOK_SETTINGS_FIELDS = ['responseMode', 'webhook'] as const

export const ADMIN_FORM_META_FIELDS = [
  'admin',
  'title',
  'lastModified',
  'status',
  '_id',
  'responseMode',
] as const

export const PAYMENT_CONTACT_FIELD_ID = 'payment_contact_field'
export const PAYMENT_PRODUCT_FIELD_ID = 'payment_products'
export const PAYMENT_VARIABLE_INPUT_AMOUNT_FIELD_ID =
  'payment_variable_input_amount_field_id'

export const CLIENT_RADIO_OTHERS_INPUT_VALUE =
  '!!FORMSG_INTERNAL_RADIO_OTHERS_VALUE!!'

export const CLIENT_CHECKBOX_OTHERS_INPUT_VALUE =
  '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'

// The current encrypt version to assign to the encrypted submission.
// This is needed if we ever break backwards compatibility with
// end-to-end encryption
export const E2EE_SUBMISSION_VERSION = 1
// Encryption boundary shift RFC: https://docs.google.com/document/d/1VmNXS_xYY2Yg30AwVqzdndBp5yRJGSDsyjBnH51ktyc/edit?usp=sharing
// Encryption boundary shift implementation PR: https://github.com/opengovsg/FormSG/pull/6587
export const VIRUS_SCANNER_SUBMISSION_VERSION = 2.1
// MRF RFC: https://www.notion.so/opengov/RFC-Multi-respondent-forms-8ab40a8c17674937b345450d9dd2c81d?pvs=4
export const MULTIRESPONDENT_FORM_SUBMISSION_VERSION = 3
