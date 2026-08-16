import { ErrorDto, I18nMessageParams } from 'formsg-shared/types'

const ADMIN_FORM_BACKEND_ERROR_KEY_PREFIX =
  'features.adminForm.backendErrors' as const

const errorKey = (suffix: string) =>
  `${ADMIN_FORM_BACKEND_ERROR_KEY_PREFIX}.${suffix}`

const ADMIN_FORM_ERROR_KEYS: Record<string, string> = {
  'Error converting feedback to JSON': errorKey(
    'exports.feedback.jsonConversion',
  ),
  'Error converting issue to JSON.': errorKey('exports.issue.jsonConversion'),
  'Error retrieving from database.': errorKey('exports.databaseRetrieval'),
  'Field to modify not found': errorKey('fields.notFound'),
  'Form does not have a public key': errorKey('whitelist.missingPublicKey'),
  'Form must be public to be copied': errorKey('template.mustBePublic'),
  'Invalid payment amount': errorKey('payments.invalidAmount'),
  'Item and Quantity exceeded limit. Either lower your quantity or lower payment amount.':
    errorKey('payments.productAmountLimitExceeded'),
  'Please enter a valid HTTP or HTTPS URI': errorKey('endPage.invalidUrl'),
  'Something went wrong. Please try creating fields again.': errorKey(
    'fields.createFailed',
  ),
  'Unsupported file type': errorKey('assets.unsupportedFileType'),
  'Your csv has one or more invalid characters.': errorKey(
    'whitelist.invalidCharacters',
  ),
  'Your csv is empty.': errorKey('whitelist.emptyCsv'),
  'Your form ID is invalid.': errorKey('whitelist.invalidFormId'),
}

const FILE_SIZE_LIMIT_PATTERN =
  /^You have exceeded the file size limit, please upload a file below (\d+) kB\.$/

export const getAdminFormErrorI18n = (
  message: string,
): Pick<ErrorDto, 'messageKey' | 'messageParams'> => {
  const messageKey = ADMIN_FORM_ERROR_KEYS[message]
  if (messageKey) return { messageKey }

  const fileSizeMatch = message.match(FILE_SIZE_LIMIT_PATTERN)
  if (fileSizeMatch) {
    const messageParams: I18nMessageParams = {
      limitKb: Number(fileSizeMatch[1]),
    }
    return {
      messageKey: errorKey('whitelist.fileTooLarge'),
      messageParams,
    }
  }

  return {}
}

export const buildAdminFormErrorDto = (message: string): ErrorDto => ({
  message,
  ...getAdminFormErrorI18n(message),
})
