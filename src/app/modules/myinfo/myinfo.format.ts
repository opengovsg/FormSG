import {
  MyInfoAddress,
  MyInfoAddressType,
  MyInfoCodeField,
  MyInfoDrivingLicence,
  MyInfoNotApplicable,
  MyInfoOccupation,
  MyInfoPhoneNumber,
  MyInfoSource,
  MyInfoValueField,
  MyInfoVehicle,
} from '@opengovsg/myinfo-gov-client'

import { DrivingLicenceAttributes } from '../../../../shared/types'
import { createLoggerWithLabel } from '../../config/logger'

const logger = createLoggerWithLabel(module)

/**
 * Formats MyInfo attribute as phone number
 * @param phone
 * @example +65 98654321
 * @returns Phone number if phone.nbr exists. Else return empty string.
 */
export const formatPhoneNumber = (
  phone: MyInfoPhoneNumber | undefined,
): string => {
  if (!phone || phone.unavailable || !phone.nbr.value) return ''

  return phone.prefix.value && phone.areacode.value
    ? `${phone.prefix.value}${phone.areacode.value} ${phone.nbr.value}`
    : phone.nbr.value
}

/**
 * Formats MyInfo attribute as address
 * @param addr The address to format.
 * @example '411 CHUA CHU KANG AVE 3, #12-3, SINGAPORE 238823'
 * @returns Formatted address if minimally the `block`, `street`, `country`,and `postal` values are not empty in {@link addr}. Else return empty string.
 */
export const formatAddress = (addr: MyInfoAddress | undefined): string => {
  if (!addr || addr.source === MyInfoSource.NotApplicable || addr.unavailable) {
    return ''
  }

  if (addr.type !== MyInfoAddressType.Singapore) {
    const { line1, line2 } = addr
    if (!line1 || !line2) {
      logger.warn({
        message: 'Missing keys from MyInfo address',
        meta: {
          action: 'formatAddress',
          isAddrTypeDefined: !!addr.type,
          isLine1Defined: !!line1,
          isLine2Defined: !!line2,
        },
      })
      return ''
    }
    let result = ''
    if (line1.value) {
      result += line1.value
    }
    if (line2.value) {
      result += ', ' + line2.value
    }
    return result
  }

  // Structured Singapore address
  const { building, block, street, floor, unit, country, postal } = addr

  if (
    !building ||
    !block ||
    !street ||
    !floor ||
    !unit ||
    !country ||
    !postal
  ) {
    logger.warn({
      message: 'Missing keys from MyInfo address',
      meta: {
        action: 'formatAddress',
        isBuildingDefined: !!building,
        isBlockDefined: !!block,
        isStreetDefined: !!street,
        isFloorDefined: !!floor,
        isUnitDefined: !!unit,
        isCountryDefined: !!country,
        isPostalDefined: !!postal,
      },
    })
    return ''
  }

  // Create an array of data in the order:
  // 1. building (if available),
  // 2. block,
  // 3. street,
  // 4. floor + unit (if available),
  // 5. country
  // 6. postal
  const buildingBlocks: string[] = []

  if (building.value) {
    buildingBlocks.push(`${building.value},`)
  }
  if (block.value) {
    buildingBlocks.push(block.value)
  }
  if (street.value) {
    buildingBlocks.push(`${street.value},`)
  }

  if (floor.value && unit.value) {
    buildingBlocks.push(`#${floor.value}-${unit.value},`)
  }

  if (country.desc) {
    buildingBlocks.push(country.desc)
  }

  if (postal.value) {
    buildingBlocks.push(postal.value)
  }

  // Return string form with each block being separated by a space.
  return buildingBlocks.join(' ')
}

/**
 * Converts a MyInfo field with a code and description into a
 * prefilled field value.
 * @param field Field to format
 */
export const formatDescriptionField = (
  field: MyInfoCodeField | MyInfoNotApplicable | undefined,
): string => {
  if (
    !field ||
    field.source === MyInfoSource.NotApplicable ||
    field.unavailable
  )
    return ''
  return field.desc
}

/**
 * Converts a MyInfo field with a single value into a
 * prefilled field value.
 * @param field Field to format
 */
export const formatBasicField = (
  field: MyInfoValueField | MyInfoNotApplicable | undefined,
): string => {
  if (
    !field ||
    field.source === MyInfoSource.NotApplicable ||
    field.unavailable
  )
    return ''
  return field.value
}

/**
 * Converts a MyInfo Vehicle Number field into a
 * prefilled field value.
 * @param field Field to format
 */
export const formatVehicleNumbers = (
  field: MyInfoVehicle[] | undefined,
): string => {
  if (!field) return ''
  const vehicleNumbers: string[] = []
  field.forEach((vehicle) => {
    if (vehicle.unavailable) return
    if (vehicle.vehicleno?.value) {
      vehicleNumbers.push(vehicle.vehicleno.value)
    }
  })
  return vehicleNumbers.join(', ')
}

/**
 * Converts a MyInfo Occupation field into a
 * prefilled field value.
 * @param field Field to format
 */
export const formatOccupation = (
  field: MyInfoOccupation | undefined,
): string => {
  if (!field || field.unavailable) return ''
  // Occupation can either contain value or (code and description)
  if ('value' in field) return field.value
  return field.desc
}

/**
 * Formats a MyInfo workpass status value
 * by ensuring that it is in title case.
 * Possible values are 'Live', 'Approved'.
 */
export const formatWorkpassStatus = (
  field: MyInfoValueField | MyInfoNotApplicable | undefined,
): string => {
  // Field value should always be a string, but check for type safety since
  // string methods need to be called
  if (
    !field ||
    field.source === MyInfoSource.NotApplicable ||
    field.unavailable ||
    typeof field.value !== 'string'
  )
    return ''
  // Change to title case
  const originalValue = field.value
  return (
    originalValue.slice(0, 1).toUpperCase() +
    originalValue.slice(1).toLowerCase()
  )
}

export const formatDrivingLicenceField = (
  field: MyInfoDrivingLicence | MyInfoNotApplicable | undefined,
  attr: DrivingLicenceAttributes | undefined,
): string => {
  if (
    !field ||
    field.source === MyInfoSource.NotApplicable ||
    field.unavailable
  ) {
    return ''
  }

  switch (attr) {
    case DrivingLicenceAttributes.ComStatus:
      return field.comstatus?.desc || ''
    case DrivingLicenceAttributes.TotalDemeritPoints:
      return String(field.totaldemeritpoints?.value) || ''
    case DrivingLicenceAttributes.SuspensionStartDate:
      return String(field.suspension?.startdate?.value) || ''
    case DrivingLicenceAttributes.SuspensionEndDate:
      return String(field.suspension?.enddate?.value) || ''
    case DrivingLicenceAttributes.DisqualificationStartDate:
      return String(field.disqualification?.startdate?.value) || ''

    default: {
      const never: never = attr
      return never
    }
  }
}
