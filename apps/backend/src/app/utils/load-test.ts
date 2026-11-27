import { createHash, timingSafeEqual } from 'crypto'
import { Request } from 'express'

import config from '../config/config'

import { LOAD_TEST_BYPASS_HEADER } from './request'

const sha256 = (value: string): Buffer =>
  createHash('sha256').update(value).digest()

export const isLoadTestRequest = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: Request<any, any, any, any>,
): boolean => {
  if (config.envSiteName === 'prod') {
    return false
  }
  if (!config.envSiteName && !config.isDev) {
    return false
  }

  const bypassKey = config.rateLimitConfig.loadTestBypassKey
  if (!bypassKey) {
    return false
  }

  const provided = req.get(LOAD_TEST_BYPASS_HEADER)
  if (!provided) {
    return false
  }

  return timingSafeEqual(sha256(provided), sha256(bypassKey))
}
