/**
 * Name of cookie which contains state of sgID login, and NRIC
 * if login was successful.
 */
export const SGID_COOKIE_NAME = 'jwtSgid'

/**
 * Name of cookie containing sgID access token to
 * MyInfo scopes.
 */
export const SGID_MYINFO_COOKIE_NAME = 'jwtSgidMyInfo'

/**
 * Name of cookie which contains state of sgID login, and NRIC
 * if login was successful.
 *
 * Note: same purpose as SGID_COOKIE_NAME. Just separate cookie
 * to prevent interaction between SGID Auth only mode and
 * SGID MyInfo mode.
 */
export const SGID_MYINFO_LOGIN_COOKIE_NAME = 'jwtSgidMyInfoLogin'

export const SGID_MYINFO_NRIC_NUMBER_SCOPE = 'myinfo.nric_number'

export enum SGIDScope {
  Name = 'myinfo.name',
  NricFin = 'myinfo.nric_number',
  DateOfBirth = 'myinfo.date_of_birth',
  PassportNumber = 'myinfo.passport_number',
  PassportExpiryDate = 'myinfo.passport_expiry_date',
  MobileNumber = 'myinfo.mobile_number',
  Email = 'myinfo.email',
  RegisteredAddress = 'myinfo.registered_address',
}
