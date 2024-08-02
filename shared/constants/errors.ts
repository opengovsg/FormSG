export const ERROR_QUERY_PARAM_KEY = 'error_type'

// Payment errors namespace (100xxx)
export const DISALLOW_CONNECT_NON_WHITELIST_STRIPE_ACCOUNT = '100001'

// GoGov Bad Request error messages
export const GO_VALIDATION_ERROR_MESSAGE =
  'Validation error when claiming GoGov link'

export const GO_ALREADY_EXIST_ERROR_MESSAGE = 'GoGov link already exists'

export const FORM_SINGLE_SUBMISSION_VALIDATION_ERROR_MESSAGE =
  'You have already submitted a response using this NRIC/FIN/UEN. If you require further assistance, please contact the agency that gave you the form link.'

export const FORM_RESPONDENT_NOT_WHITELISTED_ERROR_MESSAGE =
  'You do not have access to this form. If you require further assistance, please contact the agency that gave you the form link.'

export const FORM_WHITELIST_SETTING_CONTAINS_DUPLICATES_ERROR_MESSAGE =
  'There are duplicate entries in your CSV'

export const FORM_WHITELIST_SETTING_CONTAINS_INVALID_FORMAT_SUBMITTERID_ERROR_MESSAGE =
  (exampleInvalidSubmitterId: string) =>
    `Your CSV contains NRIC/FIN/UEN(s) that are not in the correct format. (e.g, ${exampleInvalidSubmitterId})`

export const FORM_WHITELIST_CONTAINS_EMPTY_ROWS_ERROR_MESSAGE = `Your CSV contains empty row(s).`
