import { FormAuthType } from '../../../../../shared/types'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { retrieveJsonContent } from '../../../utils/iac'
import { CpOidcClient, SpOidcClient } from '../spcp.oidc.client'

import { CpOidcServiceClass } from './spcp.oidc.service.cp'
import { SpOidcServiceClass } from './spcp.oidc.service.sp'
import { OidcServiceType } from './spcp.oidc.service.types'

const spOidcClient = new SpOidcClient({
  rpClientId: spcpMyInfoConfig.spOidcRpClientId,
  rpRedirectUrl: spcpMyInfoConfig.spOidcRpRedirectUrl,
  ndiDiscoveryEndpoint: spcpMyInfoConfig.spOidcNdiDiscoveryEndpoint,
  ndiJwksEndpoint: spcpMyInfoConfig.spOidcNdiJwksEndpoint,
  rpPublicJwks: retrieveJsonContent({
    preIacFilePath: spcpMyInfoConfig.spOidcRpJwksPublicPath,
    postIacJsonString: spcpMyInfoConfig.spOidcRpJwksPublic,
  }),
  rpSecretJwks: retrieveJsonContent({
    preIacFilePath: spcpMyInfoConfig.spOidcRpJwksSecretPath,
    postIacJsonString: spcpMyInfoConfig.spOidcRpJwksSecret,
  }),
})

const spOidcProps = {
  cookieMaxAge: spcpMyInfoConfig.spCookieMaxAge,
  cookieMaxAgePreserved: spcpMyInfoConfig.spCookieMaxAgePreserved,
  cookieDomain: spcpMyInfoConfig.spcpCookieDomain,
}

const cpOidcClient = new CpOidcClient({
  rpClientId: spcpMyInfoConfig.cpOidcRpClientId,
  rpRedirectUrl: spcpMyInfoConfig.cpOidcRpRedirectUrl,
  ndiDiscoveryEndpoint: spcpMyInfoConfig.cpOidcNdiDiscoveryEndpoint,
  ndiJwksEndpoint: spcpMyInfoConfig.cpOidcNdiJwksEndpoint,
  rpPublicJwks: retrieveJsonContent({
    preIacFilePath: spcpMyInfoConfig.cpOidcRpJwksPublicPath,
    postIacJsonString: spcpMyInfoConfig.cpOidcRpJwksPublic,
  }),
  rpSecretJwks: retrieveJsonContent({
    preIacFilePath: spcpMyInfoConfig.cpOidcRpJwksSecretPath,
    postIacJsonString: spcpMyInfoConfig.cpOidcRpJwksSecret,
  }),
})

const cpOidcProps = {
  cookieMaxAge: spcpMyInfoConfig.cpCookieMaxAge,
  cookieDomain: spcpMyInfoConfig.spcpCookieDomain,
}

const SpOidcService = new SpOidcServiceClass(spOidcClient, spOidcProps)
const CpOidcService = new CpOidcServiceClass(cpOidcClient, cpOidcProps)

export const getOidcService = <T extends FormAuthType.SP | FormAuthType.CP>(
  authType: T,
): OidcServiceType<T> => {
  return (
    authType === FormAuthType.SP ? SpOidcService : CpOidcService
  ) as OidcServiceType<T>
}
