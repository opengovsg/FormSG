import { FormAuthType } from 'formsg-shared/types'

import { IFormSchema } from '../../../types'

export enum JwtName {
  SP = 'jwtSp',
  CP = 'jwtCp',
}

export enum CodeVerifierCookieName {
  SP = 'spCodeVerifier',
  CP = 'cpCodeVerifier',
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

export type SpcpDomainSettings =
  | { domain: string; path: string }
  | { [k: string]: never }

export type CodeVerifierCookieOptions = {
  httpOnly: true
  secure: boolean
  sameSite: 'lax'
  path: string
  domain?: string
}

export interface ParsedSpcpParams {
  formId: string
  destination: string
  rememberMe: boolean
  cookieDuration: number
  nonce?: string
}

export type SpcpForm<T extends IFormSchema> = T & {
  authType: FormAuthType.SP | FormAuthType.CP
  esrvcId: string
}

// Legacy: <formId>-boolean or <formId>-boolean-encodedQuery
// With nonce: <formId>-boolean-nonce-encodedQuery, where the encodedQuery
// segment is always emitted (possibly empty) so that the segment count alone
// distinguishes the two formats.
// NDI OIDC does not allow comma separated values in state
export type RedirectTargetSpcpOidc =
  | `${string}-${boolean}`
  | `${string}-${boolean}-${string}`
  | `${string}-${boolean}-${string}-${string}`
