import { createLoggerWithLabel } from '../../config/logger'

const logger = createLoggerWithLabel(module)

/**
 * Formats SGID MyInfo attribute as address.
 * SGID MyInfo multi-line address are newline-separated, while MyInfo multi-line addresses are comma-separated
 * @param addr The address to format.
 * @example '29 ROCHDALE ROAD\n\nSINGAPORE 535842'
 * @returns Formatted address is comma separated, same as the output of formatAddress in myinfo.format.ts
 */
export const formatAddress = (addr: string): string => {
  const formattedAddress = addr.replace(/(\n)+/g, ', ')
  return formattedAddress
}

/**
 * Formats SGID vehicle types.
 * SGID vehicles are a stringified array of objects, we want to output this as a string
 * @param vehicles The vehicles to format.
 * @example '[{"vehicle_number":"CB6171D"},{"vehicle_number":"SJQ7247B"}]'
 * @returns Formatted address is comma separated, same as the output of formatAddress in myinfo.format.ts
 */
export const formatVehicles = (vehicles: string): string => {
  if (vehicles && vehicles !== '[]') {
    try {
      const vehiclesObject = JSON.parse(vehicles)
      const vehicleNos = vehiclesObject
        //TODO: obtain vehicle type from SGID
        .map((vehicle: { vehicle_number: string }) => vehicle['vehicle_number'])
        .join(', ')
      return vehicleNos
    } catch (error) {
      logger.error({
        message: 'Failed to parse vehicles',
        meta: { action: 'formatVehicles', vehicles },
        error,
      })
      return ''
    }
  } else {
    return ''
  }
}
