import { AuthType, IFormSchema } from 'src/types'

export enum JwtName {
  SP = 'jwtSp',
  CP = 'jwtCp',
}

export type LoginPageValidationResult =
  | { isValid: true }
  | { isValid: false; errorCode: string | null }

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

export interface ISpcpForm extends IFormSchema {
  authType: AuthType.SP | AuthType.CP
  esrvcId: string
}
