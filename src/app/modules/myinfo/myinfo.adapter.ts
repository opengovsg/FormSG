import {
  IPerson,
  IPersonResponse,
  MyInfoAttribute as ExternalAttr,
  MyInfoScope,
  MyInfoSource,
} from '@opengovsg/myinfo-gov-client'

import {
  MyInfoAttribute as InternalAttr,
  SGIDDataTransformer,
} from '../../../../shared/types'

import {
  formatAddress,
  formatBasicField,
  formatDescriptionField,
  formatOccupation,
  formatPhoneNumber,
  formatVehicleNumbers,
  formatWorkpassStatus,
} from './myinfo.format'

/**
 * Converts an internal MyInfo attribute used in FormSG to a scope
 * which can be used to retrieve data from MyInfo.
 * @param attr Internal MyInfo attribute used in FormSG
 */
export const internalAttrToScope = (attr: InternalAttr): MyInfoScope => {
  switch (attr) {
    // Changes between MyInfo V2 and V3
    case InternalAttr.WorkpassStatus:
      return ExternalAttr.PassStatus
    case InternalAttr.WorkpassExpiryDate:
      return ExternalAttr.PassExpiryDate
    case InternalAttr.VehicleNo:
      return `${ExternalAttr.Vehicles}.vehicleno` as const
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

/**
 * Converts an internal MyInfo attribute used in FormSG to a key of the
 * data object returned by the MyInfo Person API.
 * @param attr Internal MyInfo attribute used in FormSG
 */
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

/**
 * Converts an array of internal FormSG attributes to an array of scopes
 * to request from MyInfo. Always appends UinFin to the array so that
 * consent is always obtained for getting the user's UIN/FIN.
 * @param attrs List of internal attributes used in FormSG
 */
export const internalAttrListToScopes = (
  attrs: InternalAttr[],
): MyInfoScope[] =>
  // Always ask for consent for UinFin, even though it is not a form field
  attrs.map(internalAttrToScope).concat(ExternalAttr.UinFin)

/**
 * Wrapper class for MyInfo data. Provides public methods to safely
 * extract the correct data by translating internal FormSG attributes
 * to the correct keys in the data.
 */
export class MyInfoData
  implements SGIDDataTransformer<ExternalAttr, InternalAttr>
{
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
      // Deal with workpass status bug where value is returned in uppercase
      case ExternalAttr.PassStatus:
        return formatWorkpassStatus(this.#personData[attr])
      // Remaining fields should only have 'value' key
      case ExternalAttr.Name:
      case ExternalAttr.PassportNumber:
      case ExternalAttr.Employment:
      case ExternalAttr.MarriageCertNumber:
      case ExternalAttr.DateOfBirth:
      case ExternalAttr.PassportExpiryDate:
      case ExternalAttr.MarriageDate:
      case ExternalAttr.DivorceDate:
      case ExternalAttr.PassExpiryDate:
        return formatBasicField(this.#personData[attr])
      // Above cases should be exhaustive for all attributes supported by Form.
      // Fall back to undefined as data shape is unknown.
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

    switch (attr) {
      case ExternalAttr.Vehicles:
        // Form always leaves vehicle numbers editable to preserve
        // behaviour between MyInfo V2 and V3
        return false
      case ExternalAttr.MobileNo:
      case ExternalAttr.RegisteredAddress:
      case ExternalAttr.Occupation:
      case ExternalAttr.Sex:
      case ExternalAttr.Race:
      case ExternalAttr.Dialect:
      case ExternalAttr.Nationality:
      case ExternalAttr.BirthCountry:
      case ExternalAttr.ResidentialStatus:
      case ExternalAttr.HousingType:
      case ExternalAttr.HDBType:
      case ExternalAttr.Name:
      case ExternalAttr.PassportNumber:
      case ExternalAttr.Employment:
      case ExternalAttr.PassStatus:
      case ExternalAttr.DateOfBirth:
      case ExternalAttr.PassportExpiryDate:
      case ExternalAttr.PassExpiryDate: {
        const data = this.#personData[attr]
        return (
          !!data &&
          data.source === MyInfoSource.GovtVerified &&
          !data.unavailable
        )
      }
      // Fields required to always be editable according to MyInfo docs
      case ExternalAttr.MaritalStatus:
      case ExternalAttr.MarriageDate:
      case ExternalAttr.DivorceDate:
      case ExternalAttr.CountryOfMarriage:
      case ExternalAttr.MarriageCertNumber:
        return false
      // Above cases should be exhaustive for all attributes supported by Form.
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
    const externalAttr = internalAttrToExternal(attr)
    const fieldValue = this._formatFieldValue(externalAttr)
    return {
      fieldValue,
      isReadOnly: this._isDataReadOnly(externalAttr, fieldValue),
    }
  }
}
