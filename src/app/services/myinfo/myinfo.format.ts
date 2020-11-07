import {
  CATEGORICAL_DATA_DICT,
  IMyInfoAddr,
  IMyInfoPhoneNo,
} from '@opengovsg/myinfo-gov-client'
import { get } from 'lodash'

/**
 * Formats MyInfo attribute as phone number
 * @param phone
 * @example +65 98654321
 * @returns Phone number if phone.nbr exists. Else return empty string.
 */
export const formatPhoneNumber = (phone: IMyInfoPhoneNo): string => {
  if (!phone || !phone.nbr) return ''

  return phone.prefix && phone.code && phone.nbr
    ? `${phone.prefix}${phone.code} ${phone.nbr}`
    : phone.nbr
}

/**
 * Formats MyInfo attribute as address
 * @param addr The address to format.
 * @example '411 CHUA CHU KANG AVE 3, #12-3, SINGAPORE 238823'
 * @returns Formatted address if minimally the `block`, `street`, `country`,and `postal` values are not empty in {@link addr}. Else return empty string.
 */
export const formatAddress = (addr: IMyInfoAddr): string => {
  // Early return if missing required props in address.
  if (!addr || !(addr.block && addr.street && addr.country && addr.postal)) {
    return ''
  }

  const { building, block, street, floor, unit, country, postal } = addr

  // Create an array of data in the order:
  // 1. building (if available),
  // 2. block,
  // 3. street,
  // 4. floor + unit (if available),
  // 5. country
  // 6. postal
  const buildingBlocks = []

  if (building) {
    buildingBlocks.push(`${building},`)
  }
  buildingBlocks.push(block)
  buildingBlocks.push(`${street},`)

  if (floor && unit) {
    buildingBlocks.push(`#${floor}-${unit},`)
  }

  buildingBlocks.push(
    get(
      CATEGORICAL_DATA_DICT,
      ['birthcountry', country, 'description'],
      // Return country as default value if it is not in the dictionary.
      country,
    ),
  )

  buildingBlocks.push(postal)

  // Return string form with each block being separated by a space.
  return buildingBlocks.join(' ')
}
