export type PublicFormAuthRedirectDto = { redirectURL: string }

export type PublicFormAuthValidateEsrvcIdDto =
  | { isValid: true }
  | { isValid: false; errorCode: string | null }

export type PublicFormAuthLogoutDto = { message: string }
