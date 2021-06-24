import { AuthType, IFormSchema } from '../../../types'

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

export type JwtPayload = SingpassJwtPayload | CorppassJwtPayload

type Timestamp = {
  iat: number // iat and exp are present after cookie has been set
  exp: number
}

export type SingpassJwtPayloadFromCookie = SingpassJwtPayload & Timestamp
export type CorppassJwtPayloadFromCookie = CorppassJwtPayload & Timestamp

export type JwtPayloadFromCookie =
  | SingpassJwtPayloadFromCookie
  | CorppassJwtPayloadFromCookie

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
  authType: AuthType.SP | AuthType.CP
  esrvcId: string
}
