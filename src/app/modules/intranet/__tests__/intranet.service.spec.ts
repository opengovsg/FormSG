import fs from 'fs'

import { IntranetService } from '../intranet.service'

const MOCK_IP_LIST_PATH = '__tests__/setup/mock-intranet-ips.txt'
const MOCK_IP_LIST = fs.readFileSync(MOCK_IP_LIST_PATH).toString().split('\n')

describe('IntranetService', () => {
  afterEach(() => jest.clearAllMocks())

  describe('isIntranetIp', () => {
    it('should return true when IP is in intranet IP list', () => {
      const result = IntranetService.isIntranetIp(MOCK_IP_LIST[0])

      expect(result).toBe(true)
    })

    it('should return false when IP is not in intranet IP list', () => {
      const ipNotInList = '10.20.30.40'

      const result = IntranetService.isIntranetIp(ipNotInList)

      expect(result).toBe(false)
    })

    it('should return true when IP matches an intranet CIDR entry', () => {
      const ipInCidr = '192.168.0.5'
      const result = IntranetService.isIntranetIp(ipInCidr)

      expect(result).toBe(true)
    })

    it('should return false when IP does not match any intranet CIDR entry', () => {
      const ipNotInCidr = '192.168.1.23'
      const result = IntranetService.isIntranetIp(ipNotInCidr)

      expect(result).toBe(false)
    })
  })
})
