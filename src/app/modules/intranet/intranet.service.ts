import fs from 'fs'

import {
  IIntranet,
  intranetConfig,
} from '../../config/features/intranet.config'
import { createLoggerWithLabel } from '../../config/logger'

const logger = createLoggerWithLabel(module)

/**
 * Handles intranet functionality based on a given list of intranet IPs.
 */
class IntranetServiceClass {
  /**
   * List of IP addresses associated with intranet
   */
  intranetIps: string[]

  constructor(intranetConfig: IIntranet) {
    // In future if crucial intranet-specific functionality is implemented,
    // e.g. intranet-only forms, then this try-catch should be removed so that
    // an error is thrown if the intranet IP list file does not exist.
    // For now, the functionality is not crucial, so we can default to an empty array.
    if (!intranetConfig.intranetIpListPath) {
      this.intranetIps = []
      return
    }
    try {
      this.intranetIps = fs
        .readFileSync(intranetConfig.intranetIpListPath)
        .toString()
        .split('\n')
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
    return this.intranetIps.includes(ip)
  }
}

export const IntranetService = new IntranetServiceClass(intranetConfig)
