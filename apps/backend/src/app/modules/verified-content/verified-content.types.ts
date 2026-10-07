import { FormAuthType } from 'formsg-shared/types'
import { VerifiedKeys } from 'formsg-shared/utils/verified-content'
import { Result } from 'neverthrow'

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

// MRF verifiedContent types
export type WithStepKeys<T> =
  | T
  | { [K in Extract<keyof T, string> as `${K} (Step ${number})`]: T[K] }
export type CpVerifiedContentWithStep = WithStepKeys<CpVerifiedContent>
export type SpVerifiedContentWithStep = WithStepKeys<SpVerifiedContent>

export type VerifiedContentResult<T> = Result<T, MalformedVerifiedContentError>

export type VerifiedContent = CpVerifiedContent | SpVerifiedContent

export type VerifiedContentV3 =
  | CpVerifiedContentWithStep
  | SpVerifiedContentWithStep

export type EncryptVerificationContentParams = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verifiedContent: VerifiedContent | Record<string, any>
  formPublicKey: string
}

export type GetVerifiedContentParams = {
  type: FormAuthType.CP | FormAuthType.MyInfo
  data: Record<string, unknown>
}
