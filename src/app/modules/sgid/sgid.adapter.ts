import {
  MyInfoAttribute as InternalAttr,
  MyInfoDataTransformer,
} from '../../../../shared/types'

import {
  SGID_MYINFO_NRIC_NUMBER_SCOPE,
  SGIDScope as ExternalAttr,
} from './sgid.constants'
import { formatAddress } from './sgid.format'
import { SGIDScopeToValue } from './sgid.types'

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
    case InternalAttr.MobileNo:
      return ExternalAttr.MobileNumber
    case InternalAttr.RegisteredAddress:
      return ExternalAttr.RegisteredAddress
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
      return ExternalAttr.MobileNumber
    case InternalAttr.RegisteredAddress:
      return ExternalAttr.RegisteredAddress
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
   * @param attr sgID's MyInfo OAuth scope.
   * @returns the formatted field.
   */
  _formatFieldValue(attr: ExternalAttr): string | undefined {
    console.log('sgid payload attr: ', this.#payload[attr])
    switch (attr) {
      case ExternalAttr.RegisteredAddress:
        return formatAddress(this.#payload[attr])
      default:
        return this.#payload[attr]
    }
  }

  /**
   * Refer to the myInfo data catalogue to see which fields should be read-only
   * and which fields should be editable by the user.
   * @param attr sgID MyInfo OAuth scope.
   * @param fieldValue FormSG field value.
   * @returns Whether the data/field should be readonly.
   */
  _isDataReadOnly(attr: ExternalAttr, fieldValue: string | undefined): boolean {
    const data = this.#payload[attr]
    if (!data || !fieldValue) return false

    switch (attr) {
      case ExternalAttr.MobileNumber:
      case ExternalAttr.RegisteredAddress:
      case ExternalAttr.Name:
      case ExternalAttr.PassportNumber:
      case ExternalAttr.DateOfBirth:
      case ExternalAttr.PassportExpiryDate:
      case ExternalAttr.Sex:
      case ExternalAttr.Race:
      case ExternalAttr.Nationality:
      case ExternalAttr.HousingType:
      case ExternalAttr.HdbType:
        return !!data
      // Fall back to leaving field editable as data shape is unknown.
      default:
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
    return {
      fieldValue,
      isReadOnly: true,
    }
  }
}
