import { FormAuthType } from '../../../../../shared/types'

import { CpOidcServiceClass } from './spcp.oidc.service.cp'
import { SpOidcServiceClass } from './spcp.oidc.service.sp'

export type SpcpOidcProps = {
  cookieMaxAge: number
  cookieMaxAgePreserved?: number
  cookieDomain: string
}

export type SpOidcProps = {
  cookieMaxAge: number
  cookieMaxAgePreserved: number
  cookieDomain: string
}

export type CpOidcProps = {
  cookieMaxAge: number
  cookieDomain: string
}

export type OidcServiceType<T> = T extends FormAuthType.SP
  ? SpOidcServiceClass
  : T extends FormAuthType.CP
  ? CpOidcServiceClass
  : never
