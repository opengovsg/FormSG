import { FormAuthType } from '../../../../../shared/types'
import { spcpMyInfoConfig } from '../../../config/features/spcp-myinfo.config'
import { CpOidcClient, SpOidcClient } from '../spcp.oidc.client'

import { CpOidcServiceClass } from './spcp.oidc.service.cp'
import { SpOidcServiceClass } from './spcp.oidc.service.sp'
import { OidcServiceType } from './spcp.oidc.service.types'

const spOidcClient = new SpOidcClient({
  rpClientId: spcpMyInfoConfig.spOidcRpClientId,
  rpRedirectUrl: spcpMyInfoConfig.spOidcRpRedirectUrl,
  ndiDiscoveryEndpoint: spcpMyInfoConfig.spOidcNdiDiscoveryEndpoint,
  ndiJwksEndpoint: spcpMyInfoConfig.spOidcNdiJwksEndpoint,
  rpPublicJwks: JSON.parse(spcpMyInfoConfig.spOidcRpJwksPublic),
  rpSecretJwks: JSON.parse(spcpMyInfoConfig.spOidcRpJwksSecret),
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
  rpPublicJwks: JSON.parse(spcpMyInfoConfig.cpOidcRpJwksPublic),
  rpSecretJwks: JSON.parse(spcpMyInfoConfig.cpOidcRpJwksSecret),
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
