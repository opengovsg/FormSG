import { MyInfoAttribute } from '@opengovsg/myinfo-gov-client'

import { IFieldSchema, IMyInfo } from '../../../types'
import { ProcessedFieldResponse } from '../../modules/submission/submission.types'

export interface IPossiblyPrefilledField extends IFieldSchema {
  fieldValue?: string
}

export type MyInfoHashPromises = Partial<
  Record<MyInfoAttribute, Promise<string>>
>

export type VisibleMyInfoResponse = ProcessedFieldResponse & {
  myInfo: IMyInfo
  isVisible: true
  answer: string
}
