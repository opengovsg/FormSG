import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { retrieveJsonContent } from '../../../utils/iac'
import { CpOidcClient } from '../spcp.oidc.client'

import { CpOidcServiceClass } from './spcp.oidc.service.cp'

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

const CpOidcService = new CpOidcServiceClass(cpOidcClient, cpOidcProps)

export const getOidcService = (): CpOidcServiceClass => CpOidcService
