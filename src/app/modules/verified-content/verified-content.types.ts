import { Result } from 'neverthrow'

import { FormAuthType } from '../../../../shared/types'
import { VerifiedKeys } from '../../../../shared/utils/verified-content'

import { MalformedVerifiedContentError } from './verified-content.errors'

export type SpVerifiedKeys = {
  uinFin: VerifiedKeys.SpUinFin
}

export type ICpVerifiedKeys = {
  uinFin: VerifiedKeys.CpUen
  userInfo: VerifiedKeys.CpUid
}

export type SgidVerifiedKeys = {
  uinFin: VerifiedKeys.SgidUinFin
}

export type VerifiedKeyMap = SpVerifiedKeys | ICpVerifiedKeys | SgidVerifiedKeys

export type CpVerifiedContent = {
  [VerifiedKeys.CpUen]: string
  [VerifiedKeys.CpUid]: string
}

export type SpVerifiedContent = {
  [VerifiedKeys.SpUinFin]: string
}

export type SgidVerifiedContent = {
  [VerifiedKeys.SgidUinFin]: string
}

export type VerifiedContentResult<T> = Result<T, MalformedVerifiedContentError>

export type EncryptVerificationContentParams = {
  verifiedContent: CpVerifiedContent | SpVerifiedContent | SgidVerifiedContent
  formPublicKey: string
}

export type GetVerifiedContentParams = {
  type: FormAuthType.SP | FormAuthType.CP | FormAuthType.SGID
  data: Record<string, unknown>
}
