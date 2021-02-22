import {
  AddressType,
  BasicField as MyInfoBasicField,
  FieldWithCodeAndDesc,
  MyInfoAddress,
  MyInfoOccupation,
  MyInfoPhoneNumber,
  MyInfoVehicle,
} from '@opengovsg/myinfo-gov-client'

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
  if (!addr || addr.unavailable) {
    return ''
  }

  if (addr.type === AddressType.Unformatted) {
    let result = ''
    if (addr.line1.value) {
      result += addr.line1.value
    }
    if (addr.line2.value) {
      result += ', ' + addr.line2.value
    }
    return result
  }

  // Structured Singapore address
  const { building, block, street, floor, unit, country, postal } = addr

  // Create an array of data in the order:
  // 1. building (if available),
  // 2. block,
  // 3. street,
  // 4. floor + unit (if available),
  // 5. country
  // 6. postal
  const buildingBlocks = []

  if (building.value) {
    buildingBlocks.push(`${building.value},`)
  }
  buildingBlocks.push(block.value)
  if (street.value) {
    buildingBlocks.push(`${street.value},`)
  }

  if (floor.value && unit.value) {
    buildingBlocks.push(`#${floor.value}-${unit.value},`)
  }

  buildingBlocks.push(country.desc)

  buildingBlocks.push(postal.value)

  // Return string form with each block being separated by a space.
  return buildingBlocks.filter((b) => b !== '').join(' ')
}

/**
 * Converts a MyInfo field with a code and description into a
 * prefilled field value.
 * @param field Field to format
 */
export const formatDescriptionField = (
  field: FieldWithCodeAndDesc | undefined,
): string => {
  if (!field || field.unavailable) return ''
  return field.desc
}

/**
 * Converts a MyInfo field with a single value into a
 * prefilled field value.
 * @param field Field to format
 */
export const formatBasicField = (
  field: MyInfoBasicField | undefined,
): string => {
  if (!field || field.unavailable) return ''
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
    if (vehicle.vehicleno.value) {
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
