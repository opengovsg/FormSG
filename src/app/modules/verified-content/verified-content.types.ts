import { Result } from 'neverthrow'

import { VerifiedKeys } from '../../../../shared/utils/verified-content'
import { FormAuthType } from '../../../types'

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

export type EncryptVerificationContentParams = {
  verifiedContent: CpVerifiedContent | SpVerifiedContent
  formPublicKey: string
}

export type GetVerifiedContentParams = {
  type: FormAuthType.SP | FormAuthType.CP | FormAuthType.SGID
  data: Record<string, unknown>
}
