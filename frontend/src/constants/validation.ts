import { Language } from '~shared/types'

export const REQUIRED_ERROR = 'This field is required'

export const INVALID_EMAIL_ERROR = 'Please enter a valid email'
export const INVALID_EMAIL_DOMAIN_ERROR: Record<Language, string> = {
  [Language.ENGLISH]:
    'The entered email does not belong to an allowed email domain',
  [Language.CHINESE]: '输入的电子邮箱不在允许域名之列',
  [Language.MALAY]:
    'E-mel yang dimasukkan bukan milik domain e-mel yang dibenarkan',
  [Language.TAMIL]:
    'உள்ளிடப்பட்ட மின்னஞ்சல் அனுமதிக்கப்பட்ட மின்னஞ்சலுக்குச் சொந்தமானதல்ல',
}

export const INVALID_DROPDOWN_OPTION_ERROR =
  'Entered value is not a valid dropdown option'

export const CANNOT_TRANSFER_OWNERSHIP_TO_SELF =
  'You cannot transfer ownership to yourself'
export const INVALID_COUNTRY_REGION_OPTION_ERROR =
  'Please select a valid country/region from the dropdown list'
