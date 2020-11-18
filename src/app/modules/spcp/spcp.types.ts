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
