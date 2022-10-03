import { FormAuthType } from '../../../../shared/types'
import { IFormSchema } from '../../../types'

export enum JwtName {
  SP = 'jwtSp',
  CP = 'jwtCp',
}

export type SpcpCookies = Partial<Record<JwtName, string>>

export type SingpassJwtPayload = {
  userName: string
  rememberMe: boolean
}

export type CorppassJwtPayload = {
  userName: string
  userInfo: string
  rememberMe: boolean
}

export type ExtractedSingpassNDIPayload = {
  userName: string // Continue SAML convention, userName is NRIC
}

export type ExtractedCorppassNDIPayload = {
  userName: string // Continue SAML convention, userName is UEN
  userInfo: string // Continue SAML convention, userInfo is NRIC
}

export type ExtractedNDIPayload =
  | ExtractedSingpassNDIPayload
  | ExtractedCorppassNDIPayload

export type SgidJwtPayload = {
  userName: string
  rememberMe: boolean
}

export type JwtPayload =
  | SingpassJwtPayload
  | CorppassJwtPayload
  | SgidJwtPayload

type CookieTimestamp = {
  iat: number // iat and exp are present after cookie has been set
  exp: number
}

export type SingpassJwtPayloadFromCookie = SingpassJwtPayload & CookieTimestamp
export type CorppassJwtPayloadFromCookie = CorppassJwtPayload & CookieTimestamp
export type SgidJwtPayloadFromCookie = SgidJwtPayload & CookieTimestamp

export type JwtPayloadFromCookie =
  | SingpassJwtPayloadFromCookie
  | CorppassJwtPayloadFromCookie
  | SgidJwtPayloadFromCookie

export interface SingpassAttributes {
  UserName?: string
}

export interface CorppassAttributes {
  UserInfo?: {
    CPEntID?: string
    CPUID?: string
  }
}

export type SpcpDomainSettings =
  | { domain: string; path: string }
  | { [k: string]: never }

export interface ParsedSpcpParams {
  formId: string
  destination: string
  rememberMe: boolean
  cookieDuration: number
}

export type SpcpForm<T extends IFormSchema> = T & {
  authType: FormAuthType.SP | FormAuthType.CP
  esrvcId: string
}

// either <formId>,boolean or <formId>,boolean,encodedQuery
export type RedirectTarget =
  | `${string},${boolean}`
  | `${string},${boolean},${string}`

// either <formId>-boolean or <formId>-boolean-encodedQuery
// NDI OIDC does not allow comma separated values in state
export type RedirectTargetSpOidc =
  | `${string}-${boolean}`
  | `${string}-${boolean}-${string}`
