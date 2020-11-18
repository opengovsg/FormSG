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
  extractJwtPayload: SpcpService['extractJwtPayload']
  validateOOBParams: SpcpService['validateOOBParams']
  getSpcpAttributes: SpcpService['getSpcpAttributes']
  createJWT: SpcpService['createJWT']
  addLogin: SpcpService['addLogin']
  createJWTPayload: SpcpService['createJWTPayload']
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
      validateOOBParams: () => err(error),
      getSpcpAttributes: () => errAsync(error),
      createJWT: () => err(error),
      addLogin: () => errAsync(error),
      createJWTPayload: () => err(error),
    }
  }
  return new SpcpService(props)
}

const spcpFeature = FeatureManager.get(FeatureNames.SpcpMyInfo)
export const SpcpFactory = createSpcpFactory(spcpFeature)
