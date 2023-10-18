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
 * Name of cookie containing the PKCE code verifier for sgID flow(s).
 */
export const SGID_CODE_VERIFIER_COOKIE_NAME = 'sgidCodeVerifier'

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
  Email = 'myinfo.email',
  RegisteredAddress = 'myinfo.registered_address',
  Sex = 'myinfo.sex',
  Race = 'myinfo.race',
  Nationality = 'myinfo.nationality',
  HousingType = 'myinfo.housingtype',
  HdbType = 'myinfo.hdbtype',
  BirthCountry = 'myinfo.birth_country',
  ResidentialStatus = 'myinfo.residentialstatus',
  VehicleNo = 'myinfo.vehicles',
  Employment = 'myinfo.name_of_employer',
  WorkpassStatus = 'myinfo.workpass_status',
  WorkpassExpiryDate = 'myinfo.workpass_expiry_date',
  MaritalStatus = 'myinfo.marital_status',
  // SGID also has another myinfo.mobile_number field that does not contain the country code prefix.
  // We use the one that contains prefix, as this matches our mobile number form field.
  MobileNoWithCountryCode = 'myinfo.mobile_number_with_country_code',
  Dialect = 'myinfo.dialect',
  Occupation = 'myinfo.occupation',
  CountryOfMarriage = 'myinfo.country_of_marriage',
  MarriageCertNo = 'myinfo.marriage_certificate_number',
  MarriageDate = 'myinfo.marriage_date',
  DivorceDate = 'myinfo.divorce_date',
}
