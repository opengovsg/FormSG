const PUBLIC_FORM_FIELDS = <const>[
  'admin',
  'authType',
  'endPage',
  'esrvcId',
  'form_fields',
  'form_logics',
  'hasCaptcha',
  'startPage',
  'status',
  'title',
  '_id',
  'responseMode',
]

export const EMAIL_PUBLIC_FORM_FIELDS = PUBLIC_FORM_FIELDS
export const STORAGE_PUBLIC_FORM_FIELDS = <const>[
  ...PUBLIC_FORM_FIELDS,
  'payments_field',
  'publicKey',
]

const FORM_SETTINGS_FIELDS = <const>[
  'responseMode',
  'authType',
  'esrvcId',
  'hasCaptcha',
  'inactiveMessage',
  'status',
  'submissionLimit',
  'title',
  'webhook',
]

export const EMAIL_FORM_SETTINGS_FIELDS = <const>[
  ...FORM_SETTINGS_FIELDS,
  'emails',
]
export const STORAGE_FORM_SETTINGS_FIELDS = <const>[
  ...FORM_SETTINGS_FIELDS,
  'payments_channel',
  'payments_field',
  'publicKey',
]

export const ADMIN_FORM_META_FIELDS = <const>[
  'admin',
  'title',
  'lastModified',
  'status',
  '_id',
  'responseMode',
]

export const PAYMENT_CONTACT_FIELD_ID = 'payment_contact_field'
