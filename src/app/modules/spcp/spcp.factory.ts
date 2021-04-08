import { err, errAsync } from 'neverthrow'

import FeatureManager, {
  FeatureNames,
  RegisteredFeature,
} from '../../../config/feature-manager'
import { MissingFeatureError } from '../core/core.errors'

import { SpcpService } from './spcp.service'

interface ISpcpFactory {
  createRedirectUrl: SpcpService['createRedirectUrl']
  fetchLoginPage: SpcpService['fetchLoginPage']
  validateLoginPage: SpcpService['validateLoginPage']
  extractJwt: SpcpService['extractJwt']
  extractJwtPayload: SpcpService['extractJwtPayload']
  parseOOBParams: SpcpService['parseOOBParams']
  getSpcpAttributes: SpcpService['getSpcpAttributes']
  createJWT: SpcpService['createJWT']
  createJWTPayload: SpcpService['createJWTPayload']
  getCookieSettings: SpcpService['getCookieSettings']
  extractJwtPayloadFromRequest: SpcpService['extractJwtPayloadFromRequest']
}

export const createSpcpFactory = ({
  isEnabled,
  props,
}: RegisteredFeature<FeatureNames.SpcpMyInfo>): ISpcpFactory => {
  if (!isEnabled || !props) {
    const error = new MissingFeatureError(FeatureNames.SpcpMyInfo)
    return {
      createRedirectUrl: () => err(error),
      fetchLoginPage: () => errAsync(error),
      validateLoginPage: () => err(error),
      extractJwtPayload: () => errAsync(error),
      extractJwt: () => err(error),
      parseOOBParams: () => err(error),
      getSpcpAttributes: () => errAsync(error),
      createJWT: () => err(error),
      createJWTPayload: () => err(error),
      getCookieSettings: () => ({}),
      extractJwtPayloadFromRequest: () => errAsync(error),
    }
  }
  return new SpcpService(props)
}

const spcpFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)
export const SpcpFactory = createSpcpFactory(spcpFeature)
