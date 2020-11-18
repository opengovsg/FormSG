export type LoginPageValidationResult =
  | { isValid: true }
  | { isValid: false; errorCode: string | null }
