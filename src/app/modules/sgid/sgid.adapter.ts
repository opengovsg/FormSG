import {
  MyInfoAttribute as InternalAttr,
  SGIDDataTransformer,
} from '../../../../shared/types'

import {
  SGID_MYINFO_NRIC_NUMBER_SCOPE,
  SGIDScope as ExternalAttr,
} from './sgid.constants'
import { SGIDScopeToValue } from './sgid.types'

export const internalAttrToScope = (attr: InternalAttr): ExternalAttr => {
  switch (attr) {
    case InternalAttr.Name:
      return ExternalAttr.Name
    case InternalAttr.DateOfBirth:
      return ExternalAttr.DateOfBirth
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
  // Always ask for NRIC
  `openid ${ExternalAttr.NricFin} ${attrs
    .map(internalAttrToScope)
    .join(' ')}`.trim()

const internalAttrToSGIDExternal = (
  attr: InternalAttr,
): ExternalAttr | undefined => {
  switch (attr) {
    case InternalAttr.Name:
      return ExternalAttr.Name
    case InternalAttr.DateOfBirth:
      return ExternalAttr.DateOfBirth
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
  implements SGIDDataTransformer<ExternalAttr, InternalAttr>
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
    return this.#payload[attr]
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
