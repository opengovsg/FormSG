import {
  MyInfoAttribute as InternalAttr,
  MyInfoDataTransformer,
} from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'

import {
  SGID_MYINFO_NRIC_NUMBER_SCOPE,
  SGIDScope as ExternalAttr,
} from './sgid.constants'
import { formatAddress, formatVehicles } from './sgid.format'
import { SGIDScopeToValue } from './sgid.types'

const logger = createLoggerWithLabel(module)

export const internalAttrToScope = (attr: InternalAttr): ExternalAttr => {
  switch (attr) {
    case InternalAttr.Name:
      return ExternalAttr.Name
    case InternalAttr.Sex:
      return ExternalAttr.Sex
    case InternalAttr.DateOfBirth:
      return ExternalAttr.DateOfBirth
    case InternalAttr.Race:
      return ExternalAttr.Race
    case InternalAttr.Nationality:
      return ExternalAttr.Nationality
    case InternalAttr.HousingType:
      return ExternalAttr.HousingType
    case InternalAttr.HdbType:
      return ExternalAttr.HdbType
    case InternalAttr.PassportNumber:
      return ExternalAttr.PassportNumber
    case InternalAttr.PassportExpiryDate:
      return ExternalAttr.PassportExpiryDate
    case InternalAttr.RegisteredAddress:
      return ExternalAttr.RegisteredAddress
    case InternalAttr.BirthCountry:
      return ExternalAttr.BirthCountry
    case InternalAttr.VehicleNo:
      return ExternalAttr.VehicleNo
    case InternalAttr.Employment:
      return ExternalAttr.Employment
    case InternalAttr.WorkpassStatus:
      return ExternalAttr.WorkpassStatus
    case InternalAttr.WorkpassExpiryDate:
      return ExternalAttr.WorkpassExpiryDate
    case InternalAttr.Marital:
      return ExternalAttr.MaritalStatus
    case InternalAttr.MobileNo:
      return ExternalAttr.MobileNoWithCountryCode
    case InternalAttr.ResidentialStatus:
      return ExternalAttr.ResidentialStatus
    case InternalAttr.Dialect:
      return ExternalAttr.Dialect
    case InternalAttr.Occupation:
      return ExternalAttr.Occupation
    case InternalAttr.CountryOfMarriage:
      return ExternalAttr.CountryOfMarriage
    case InternalAttr.MarriageCertNo:
      return ExternalAttr.MarriageCertNo
    case InternalAttr.MarriageDate:
      return ExternalAttr.MarriageDate
    case InternalAttr.DivorceDate:
      return ExternalAttr.DivorceDate
    default:
      // This should be removed once sgID reaches parity with MyInfo.
      // For now, the returned value will be automatically filtered
      // out by other functions.
      return ExternalAttr.NricFin
  }
}

export const internalAttrListToScopes = (attrs: InternalAttr[]): string =>
  [
    'openid',
    // Deduplicate and always ask for NRIC
    ...new Set([ExternalAttr.NricFin, ...attrs.map(internalAttrToScope)]),
  ].join(' ')

const internalAttrToSGIDExternal = (
  attr: InternalAttr,
): ExternalAttr | undefined => {
  switch (attr) {
    case InternalAttr.Name:
      return ExternalAttr.Name
    case InternalAttr.Sex:
      return ExternalAttr.Sex
    case InternalAttr.DateOfBirth:
      return ExternalAttr.DateOfBirth
    case InternalAttr.Race:
      return ExternalAttr.Race
    case InternalAttr.Nationality:
      return ExternalAttr.Nationality
    case InternalAttr.HousingType:
      return ExternalAttr.HousingType
    case InternalAttr.HdbType:
      return ExternalAttr.HdbType
    case InternalAttr.PassportNumber:
      return ExternalAttr.PassportNumber
    case InternalAttr.PassportExpiryDate:
      return ExternalAttr.PassportExpiryDate
    case InternalAttr.MobileNo:
      return ExternalAttr.MobileNoWithCountryCode
    case InternalAttr.RegisteredAddress:
      return ExternalAttr.RegisteredAddress
    case InternalAttr.BirthCountry:
      return ExternalAttr.BirthCountry
    case InternalAttr.ResidentialStatus:
      return ExternalAttr.ResidentialStatus
    case InternalAttr.VehicleNo:
      return ExternalAttr.VehicleNo
    case InternalAttr.Employment:
      return ExternalAttr.Employment
    case InternalAttr.WorkpassStatus:
      return ExternalAttr.WorkpassStatus
    case InternalAttr.WorkpassExpiryDate:
      return ExternalAttr.WorkpassExpiryDate
    case InternalAttr.Marital:
      return ExternalAttr.MaritalStatus
    case InternalAttr.Dialect:
      return ExternalAttr.Dialect
    case InternalAttr.Occupation:
      return ExternalAttr.Occupation
    case InternalAttr.CountryOfMarriage:
      return ExternalAttr.CountryOfMarriage
    case InternalAttr.MarriageCertNo:
      return ExternalAttr.MarriageCertNo
    case InternalAttr.MarriageDate:
      return ExternalAttr.MarriageDate
    case InternalAttr.DivorceDate:
      return ExternalAttr.DivorceDate
    default:
      return undefined
  }
}

/**
 * Wrapper class for SGIDData.
 *
 * Currently only supports MyInfo.
 */
export class SGIDMyInfoData
  implements MyInfoDataTransformer<ExternalAttr, InternalAttr>
{
  #payload: SGIDScopeToValue
  constructor(payload: SGIDScopeToValue) {
    this.#payload = payload
  }

  getUinFin(): string {
    return this.#payload[SGID_MYINFO_NRIC_NUMBER_SCOPE]
  }

  /**
   * Placeholder. For now, there are not enough public fields in
   * sgID's MyInfo catalog to require significant formatting.
   * SGID returns 'NA' for field values that do not exist (vs empty string returned by Singpass MyInfo)
   * @param attr sgID's MyInfo OAuth scope.
   * @returns the formatted field.
   */
  _formatFieldValue(attr: ExternalAttr): string | undefined {
    const fieldValue = this.#payload[attr]
    // returned payload might be empty if the form fields were edited after the initial scope sent to sgid
    // sgid would then respond only the data initially requested
    // but the form now expects more fields
    if (!fieldValue) {
      return ''
    }
    switch (attr) {
      case ExternalAttr.RegisteredAddress:
        return formatAddress(fieldValue)
      case ExternalAttr.VehicleNo:
        return formatVehicles(fieldValue)
      default:
        // SGID returns NA if they do not have the value. We want to return an empty string instead,
        // so that this can be processed by our frontend in the same way as Singpass MyInfo
        return fieldValue === 'NA' ? '' : fieldValue
    }
  }

  /**
   * SGID only returns verified MyInfo fields, unless the field contains marriage-related information
   * (decision by SNDGO & MSF due to overseas unregistered marriages).
   * An empty myInfo field will always evaluate
   * to false so that the field can be filled by form-filler.
   *
   * The affected marriage fields are:
   * - marital
   * - marriagedate
   * - divorcedate
   * - countryofmarriage
   * - marriagecertno
   *
   * @param attr sgID MyInfo OAuth scope.
   * @param fieldValue FormSG field value.
   * @returns Whether the data/field should be readonly.
   */
  _isDataReadOnly(attr: ExternalAttr, fieldValue: string | undefined): boolean {
    const data = this.#payload[attr]
    if (!data || !fieldValue) return false

    switch (attr) {
      case ExternalAttr.RegisteredAddress:
      case ExternalAttr.Name:
      case ExternalAttr.PassportNumber:
      case ExternalAttr.DateOfBirth:
      case ExternalAttr.ResidentialStatus:
      case ExternalAttr.PassportExpiryDate:
      case ExternalAttr.Sex:
      case ExternalAttr.Race:
      case ExternalAttr.Nationality:
      case ExternalAttr.HousingType:
      case ExternalAttr.HdbType:
      case ExternalAttr.BirthCountry:
      case ExternalAttr.VehicleNo:
      case ExternalAttr.Employment:
      case ExternalAttr.WorkpassStatus:
      case ExternalAttr.WorkpassExpiryDate:
      case ExternalAttr.Dialect:
      case ExternalAttr.Occupation:
        return !!data
      // Fields required to always be editable according to MyInfo docs
      case ExternalAttr.MobileNoWithCountryCode:
      case ExternalAttr.MaritalStatus:
      case ExternalAttr.CountryOfMarriage:
      case ExternalAttr.MarriageCertNo:
      case ExternalAttr.MarriageDate:
      case ExternalAttr.DivorceDate:
        return false
      // Fall back to leaving field editable as data shape is unknown.
      default:
        logger.error({
          message: 'Unknown attribute found in SGID MyInfo field',
          meta: {
            action: '_isDataReadOnly',
            fieldValue,
            attr,
          },
        })
        return false
    }
  }

  /**
   * Retrieves the fieldValue for the given internal MyInfo attribute.
   * @param attr Internal FormSG MyInfo attribute
   */
  getFieldValueForAttr(attr: InternalAttr): {
    fieldValue: string | undefined
    isReadOnly: boolean
  } {
    const externalAttr = internalAttrToSGIDExternal(attr)
    if (externalAttr === undefined) {
      return {
        fieldValue: undefined,
        isReadOnly: false,
      }
    }
    const fieldValue = this._formatFieldValue(externalAttr)
    logger.info({
      message: 'get field value',
      meta: {
        action: 'getFieldValueForAttr',
        fieldValue,
        externalAttr,
      },
    })
    return {
      fieldValue,
      isReadOnly: this._isDataReadOnly(externalAttr, fieldValue),
    }
  }
}
