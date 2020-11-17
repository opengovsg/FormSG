export enum JwtName {
  SP = 'jwtSp',
  CP = 'jwtCp',
}

export type LoginPageValidationResult =
  | { isValid: true }
  | { isValid: false; errorCode: string | null }

export type SpcpCookies = Partial<Record<JwtName, string>>
