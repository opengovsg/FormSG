import fs from 'fs'

import { IntranetService } from '../intranet.service'

const MOCK_IP_LIST = ['1.2.3.4', '5.6.7.8']
const MOCK_IP_LIST_FILE = Buffer.from(MOCK_IP_LIST.join('\n'))
const MOCK_IP_LIST_PATH = '../some/path'

jest.mock('fs', () => ({
  ...(jest.requireActual('fs') as typeof fs),
  readFileSync: jest.fn().mockImplementation(() => MOCK_IP_LIST_FILE),
}))

describe('IntranetService', () => {
  const intranetService = new IntranetService({
    intranetIpListPath: MOCK_IP_LIST_PATH,
  })

  afterEach(() => jest.clearAllMocks())
  describe('constructor', () => {
    it('should instantiate without errors', () => {
      const intranetService = new IntranetService({
        intranetIpListPath: MOCK_IP_LIST_PATH,
      })

      expect(intranetService).toBeTruthy()
    })
  })

  describe('isIntranetIp', () => {
    it('should return true when IP is in intranet IP list', () => {
      const result = intranetService.isIntranetIp(MOCK_IP_LIST[0])

      expect(result._unsafeUnwrap()).toBe(true)
    })

    it('should return false when IP is not in intranet IP list', () => {
      const ipNotInList = '10.20.30.40'

      const result = intranetService.isIntranetIp(ipNotInList)

      expect(result._unsafeUnwrap()).toBe(false)
    })
  })
})
