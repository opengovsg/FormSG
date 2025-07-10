import * as ipAddress from 'ip-address'

import {
  IIntranet,
  intranetConfig,
} from '../../config/features/intranet.config'
import { createLoggerWithLabel } from '../../config/logger'
import { retrieveFileContent } from '../../utils/iac'

const logger = createLoggerWithLabel(module)

/**
 * Handles intranet functionality based on a given list of intranet IPs.
 */
class IntranetServiceClass {
  /**
   * List of IP addresses associated with intranet
   */
  intranetIps: (ipAddress.Address4 | ipAddress.Address6)[]

  constructor(intranetConfig: IIntranet) {
    // In future if crucial intranet-specific functionality is implemented,
    // e.g. intranet-only forms, then this try-catch should be removed so that
    // an error is thrown if the intranet IP list file does not exist.
    // For now, the functionality is not crucial, so we can default to an empty array.
    // TODO: (IaC Migration) Remove this double check after IaC migration is fully completed
    if (!intranetConfig.intranetIpList && !intranetConfig.intranetIpListPath) {
      this.intranetIps = []
      return
    }
    try {
      const intranetIpList = retrieveFileContent({
        preIacFilePath: intranetConfig.intranetIpListPath,
        postIacBase64EncodedString: intranetConfig.intranetIpList,
      })
        .split('\n')
        .filter((line) => !line.startsWith('#') && line.trim() !== '')

      this.intranetIps = intranetIpList
        .map((ip) => {
          const parsedIp = IntranetServiceClass.parseIp(ip.trim())
          if (!parsedIp) {
            logger.warn({
              message: `Invalid IP address in intranet IP list: ${ip}`,
              meta: {
                action: 'IntranetService',
              },
            })
          }
          return parsedIp
        })
        .filter(
          (ip): ip is ipAddress.Address4 | ipAddress.Address6 => ip !== null,
        )
    } catch {
      logger.warn({
        message: 'Could not read file containing intranet IPs',
        meta: {
          action: 'IntranetService',
        },
      })
      this.intranetIps = []
    }
  }

  /**
   * Checks whether the given IP address is an intranet IP.
   * @param ip IP address to check
   * @returns Whether the IP address originated from the intranet
   */
  isIntranetIp(ip: string): boolean {
    const parsedIp = IntranetServiceClass.parseIp(ip)
    if (!parsedIp) {
      return false
    }

    const intranetIpMatches = this.intranetIps.map((intranetIp) =>
      parsedIp.isInSubnet(intranetIp),
    )

    return intranetIpMatches.includes(true)
  }

  /**
   * Parses the given IP address string into an Address4 or Address6 object.
   * If the IP address is invalid, returns null.
   * @param ip IP address string to parse
   * @return Parsed IP address or null if invalid
   */
  static parseIp(ip: string): ipAddress.Address4 | ipAddress.Address6 | null {
    if (ipAddress.Address4.isValid(ip)) {
      return new ipAddress.Address4(ip)
    } else if (ipAddress.Address6.isValid(ip)) {
      return new ipAddress.Address6(ip)
    } else {
      return null
    }
  }
}

export const IntranetService = new IntranetServiceClass(intranetConfig)
