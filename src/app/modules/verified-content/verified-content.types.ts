import { Result } from 'neverthrow'

import { VerifiedKeys } from '../../../shared/util/verified-content'
import { AuthType } from '../../../types'
import { MissingFeatureError } from '../core/core.errors'

import { MalformedVerifiedContentError } from './verified-content.errors'

export type SpVerifiedKeys = {
  uinFin: VerifiedKeys.SpUinFin
}

export type ICpVerifiedKeys = {
  uinFin: VerifiedKeys.CpUen
  userInfo: VerifiedKeys.CpUid
}

export type VerifiedKeyMap = SpVerifiedKeys | ICpVerifiedKeys

export type CpVerifiedContent = {
  [VerifiedKeys.CpUen]: string
  [VerifiedKeys.CpUid]: string
}

export type SpVerifiedContent = {
  [VerifiedKeys.SpUinFin]: string
}

export type VerifiedContentResult<T> = Result<T, MalformedVerifiedContentError>
export type FactoryVerifiedContentResult<T, E> = Result<
  T,
  E | MissingFeatureError
>

export type EncryptVerificationContentParams = {
  verifiedContent: CpVerifiedContent | SpVerifiedContent
  formPublicKey: string
}

export type GetVerifiedContentParams = {
  type: Exclude<AuthType, AuthType.NIL>
  data: Record<string, unknown>
}
