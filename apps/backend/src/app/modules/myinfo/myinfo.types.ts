import { MyInfoAttribute, MyInfoChildAttributes } from 'formsg-shared/types'

import { IMyInfo } from '../../../types'
import { ISpcpMyInfo } from '../../config/features/spcp-myinfo.config'
import { ProcessedFieldResponse } from '../submission/submission.types'

export interface IMyInfoServiceConfig {
  spcpMyInfoConfig: ISpcpMyInfo
}

// Field ID or a special key for a Child
export type MyInfoKey = string | MyInfoChildKey

// Field type, field ID, child attribute type, child index, child name
export type MyInfoChildKey =
  `${MyInfoAttribute.ChildrenBirthRecords}.${string}.${MyInfoChildAttributes}.${number}.${string}`

export type MyInfoHashPromises = Partial<
  Record<MyInfoAttribute | MyInfoChildKey, Promise<string>>
>

export type VisibleMyInfoResponse = ProcessedFieldResponse & {
  myInfo: IMyInfo
  isVisible: true
  answer: string
}

export type MyInfoComparePromises = Map<
  string | MyInfoChildKey,
  Promise<boolean>
>

export type MyInfoLoginCookiePayload = {
  uinFin: string
}
