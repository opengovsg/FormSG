import { Mode as MyInfoClientMode } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson'

import { ISpcpMyInfo } from 'src/config/feature-manager'

export const MOCK_SERVICE_PARAMS: ISpcpMyInfo = {
  isSPMaintenance: 'isSPMaintenance',
  isCPMaintenance: 'isCPMaintenance',
  spCookieMaxAge: 1,
  spCookieMaxAgePreserved: 2,
  spcpCookieDomain: 'spcpCookieDomain',
  cpCookieMaxAge: 3,
  spIdpId: 'spIdpId',
  cpIdpId: 'cpIdpId',
  spPartnerEntityId: 'spPartnerEntityId',
  cpPartnerEntityId: 'cpPartnerEntityId',
  spIdpLoginUrl: 'spIdpLoginUrl',
  cpIdpLoginUrl: 'cpIdpLoginUrl',
  spIdpEndpoint: 'spIdpEndpoint',
  cpIdpEndpoint: 'cpIdpEndpoint',
  spEsrvcId: 'spEsrvcId',
  cpEsrvcId: 'cpEsrvcId',
  spFormSgKeyPath: 'spFormSgKeyPath',
  cpFormSgKeyPath: 'cpFormSgKeyPath',
  spFormSgCertPath: 'spFormSgCertPath',
  cpFormSgCertPath: 'cpFormSgCertPath',
  spIdpCertPath: 'spIdpCertPath',
  cpIdpCertPath: 'cpIdpCertPath',
  myInfoClientMode: MyInfoClientMode.Dev,
  myInfoKeyPath: 'myInfoKeyPath',
}

export const MOCK_ESRVCID = 'eServiceId'
export const MOCK_TARGET = new ObjectId().toHexString()
export const MOCK_REDIRECT_URL = 'redirectUrl'
