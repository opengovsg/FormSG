import { MyInfoAttribute } from '../types'

/**
 * Myinfo attributes a respondent cannot edit once Myinfo fills them with a
 * government-verified value. Marital details stay editable (SNDGO and MSF, for
 * overseas unregistered marriages), and so do vehicle numbers. Must match the
 * backend's `MyInfoData._isDataReadOnly`, which a backend test checks.
 */
const LOCKED_WHEN_VERIFIED: ReadonlySet<MyInfoAttribute> = new Set([
  MyInfoAttribute.Name,
  MyInfoAttribute.PassportNumber,
  MyInfoAttribute.RegisteredAddress,
  MyInfoAttribute.Employment,
  MyInfoAttribute.Sex,
  MyInfoAttribute.Race,
  MyInfoAttribute.Dialect,
  MyInfoAttribute.Nationality,
  MyInfoAttribute.BirthCountry,
  MyInfoAttribute.ResidentialStatus,
  MyInfoAttribute.HousingType,
  MyInfoAttribute.HdbType,
  MyInfoAttribute.Occupation,
  MyInfoAttribute.MobileNo,
  MyInfoAttribute.DateOfBirth,
  MyInfoAttribute.PassportExpiryDate,
  MyInfoAttribute.WorkpassStatus,
  MyInfoAttribute.WorkpassExpiryDate,
])

/** Whether a verified value for this attribute locks the field. */
export const isMyInfoAttrLockedWhenVerified = (
  attr: MyInfoAttribute,
): boolean => LOCKED_WHEN_VERIFIED.has(attr)
