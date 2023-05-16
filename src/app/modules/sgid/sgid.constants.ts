/**
 * Name of cookie which contains state of sgid login, and access
 * token if login was successful.
 */
export const SGID_COOKIE_NAME = 'jwtSgid'

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
