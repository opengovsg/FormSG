export enum JwtName {
  SP = 'jwtSp',
  CP = 'jwtCp',
}

export type LoginPageValidationResult =
  | { isValid: true }
  | { isValid: false; errorCode: string | null }

export type SpcpCookies = Partial<Record<JwtName, string>>

export type JwtPayload = {
  userName: string
  userInfo?: string
  rememberMe: boolean
}

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
