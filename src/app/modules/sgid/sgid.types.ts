import { FormAuthType } from '../../../../shared/types'
import { IFormSchema } from '../../../types'

export type SgidForm<T extends IFormSchema> = T & {
  authType: FormAuthType.SGID
}

export type SGIDScopeToValue = Record<string, string>

export type SGIDJwtSingpassPayload = { userName: string }
export type SGIDJwtAccessPayload = {
  accessToken: string
  rememberMe: boolean
}

export type SGIDJwtVerifierFunction<
  T extends SGIDJwtSingpassPayload | SGIDJwtAccessPayload,
> = (payload: unknown) => payload is T
