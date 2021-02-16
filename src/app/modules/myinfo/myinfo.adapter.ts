import {
  IPerson,
  IPersonResponse,
  MyInfoAttribute as ExternalAttr,
  MyInfoSource,
} from '@opengovsg/myinfo-gov-client'

import { MyInfoAttribute as InternalAttr } from '../../../types'

import {
  formatAddress,
  formatBasicField,
  formatDescriptionField,
  formatOccupation,
  formatPhoneNumber,
  formatVehicleNumbers,
} from './myinfo.format'

export const internalAttrToExternal = (attr: InternalAttr): ExternalAttr => {
  switch (attr) {
    // Changes between MyInfo V2 and V3
    case InternalAttr.WorkpassStatus:
      return ExternalAttr.PassStatus
    case InternalAttr.WorkpassExpiryDate:
      return ExternalAttr.PassExpiryDate
    case InternalAttr.VehicleNo:
      return ExternalAttr.Vehicles
    // Unchanged fields
    case InternalAttr.Name:
      return ExternalAttr.Name
    case InternalAttr.PassportNumber:
      return ExternalAttr.PassportNumber
    case InternalAttr.RegisteredAddress:
      return ExternalAttr.RegisteredAddress
    case InternalAttr.Employment:
      return ExternalAttr.Employment
    case InternalAttr.MarriageCertNo:
      return ExternalAttr.MarriageCertNumber
    case InternalAttr.Sex:
      return ExternalAttr.Sex
    case InternalAttr.Race:
      return ExternalAttr.Race
    case InternalAttr.Dialect:
      return ExternalAttr.Dialect
    case InternalAttr.Nationality:
      return ExternalAttr.Nationality
    case InternalAttr.BirthCountry:
      return ExternalAttr.BirthCountry
    case InternalAttr.ResidentialStatus:
      return ExternalAttr.ResidentialStatus
    case InternalAttr.HousingType:
      return ExternalAttr.HousingType
    case InternalAttr.HdbType:
      return ExternalAttr.HDBType
    case InternalAttr.Marital:
      return ExternalAttr.MaritalStatus
    case InternalAttr.CountryOfMarriage:
      return ExternalAttr.CountryOfMarriage
    case InternalAttr.Occupation:
      return ExternalAttr.Occupation
    case InternalAttr.MobileNo:
      return ExternalAttr.MobileNo
    case InternalAttr.DateOfBirth:
      return ExternalAttr.DateOfBirth
    case InternalAttr.PassportExpiryDate:
      return ExternalAttr.PassportExpiryDate
    case InternalAttr.MarriageDate:
      return ExternalAttr.MarriageDate
    case InternalAttr.DivorceDate:
      return ExternalAttr.DivorceDate
  }
}

export const internalAttrListToExternal = (
  attrs: InternalAttr[],
): ExternalAttr[] =>
  attrs.map(internalAttrToExternal).concat(ExternalAttr.UinFin)

export class MyInfoData {
  #personData: IPerson
  #uinFin: string

  constructor(personData: IPersonResponse) {
    this.#personData = personData.data
    this.#uinFin = personData.uinFin
  }

  getUinFin(): string {
    return this.#uinFin
  }

  _formatFieldValue(attr: ExternalAttr): string | undefined {
    switch (attr) {
      case ExternalAttr.MobileNo:
        return formatPhoneNumber(this.#personData[attr])
      case ExternalAttr.RegisteredAddress:
        return formatAddress(this.#personData[attr])
      case ExternalAttr.Vehicles:
        return formatVehicleNumbers(this.#personData[attr])
      case ExternalAttr.Occupation:
        return formatOccupation(this.#personData[attr])
      // Where field has code and description, return description
      case ExternalAttr.Sex:
      case ExternalAttr.Race:
      case ExternalAttr.Dialect:
      case ExternalAttr.Nationality:
      case ExternalAttr.BirthCountry:
      case ExternalAttr.ResidentialStatus:
      case ExternalAttr.HousingType:
      case ExternalAttr.HDBType:
      case ExternalAttr.MaritalStatus:
      case ExternalAttr.CountryOfMarriage:
        return formatDescriptionField(this.#personData[attr])
      // Remaining fields should only have 'value' key
      case ExternalAttr.Name:
      case ExternalAttr.PassportNumber:
      case ExternalAttr.Employment:
      case ExternalAttr.MarriageCertNumber:
      case ExternalAttr.PassStatus:
      case ExternalAttr.DateOfBirth:
      case ExternalAttr.PassportExpiryDate:
      case ExternalAttr.MarriageDate:
      case ExternalAttr.DivorceDate:
      case ExternalAttr.PassExpiryDate:
        return formatBasicField(this.#personData[attr])
      // Above cases should be exhaustive. Fall back to undefined
      // as data shape is unknown.
      default:
        return undefined
    }
  }

  /**
   * Determine if frontend should lock the field to prevent it from being
   * editable. The field is locked if it is government-verified and if it
   * does not contain marriage-related information (decision by SNDGO & MSF due to
   * overseas unregistered marriages). An empty myInfo field will always evaluate
   * to false so that the field can be filled by form-filler.
   *
   * The affected marriage fields are:
   * - marital
   * - marriagedate
   * - divorcedate
   * - countryofmarriage
   * - marriagecertno
   *
   * The function also uses the provided "source" flag within each MyInfo field to
   * determine whether data is government verified.
   *
   * The mapping for "source" field is:
   *
   * 1 - Government-verified Data
   * 2 - User Provided Data
   * 3 - Not Applicable (e.g. CPF data for foreigners)
   * 4 - Data retrieved from SingPass (e.g. email, mobileno)
   *
   */
  _isDataReadOnly(
    attr: ExternalAttr,
    myInfoValue: string | undefined,
  ): boolean {
    const data = this.#personData[attr]
    if (!data || !myInfoValue) return false
    // Edge case: data is in array format
    if (Array.isArray(data)) {
      // All array items have source attribute
      return (data as { source: MyInfoSource }[]).every(
        (item) => item.source === MyInfoSource.GovtVerified,
      )
    }
    return (
      !data.unavailable &&
      data.source === MyInfoSource.GovtVerified &&
      ![
        ExternalAttr.MaritalStatus,
        ExternalAttr.MarriageDate,
        ExternalAttr.DivorceDate,
        ExternalAttr.CountryOfMarriage,
        ExternalAttr.MarriageCertNumber,
      ].includes(attr)
    )
  }

  getFieldValueForAttr(
    attr: InternalAttr,
  ): { fieldValue: string | undefined; isReadOnly: boolean } {
    const externalAttr = internalAttrToExternal(attr)
    const fieldValue = this._formatFieldValue(externalAttr)
    return {
      fieldValue,
      isReadOnly: this._isDataReadOnly(externalAttr, fieldValue),
    }
  }
}
