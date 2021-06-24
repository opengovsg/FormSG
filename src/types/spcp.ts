export interface SpcpSession {
  userName: string
  iat?: number // Optional as these are not returned for MyInfo forms
  rememberMe?: boolean
  exp?: number
}
