import { LeanDocument } from 'mongoose'

import { IFieldSchema, IMyInfo, MyInfoAttribute } from '../../../types'
import { ProcessedFieldResponse } from '../../modules/submission/submission.types'

export interface IPossiblyPrefilledField extends LeanDocument<IFieldSchema> {
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

export type MyInfoComparePromises = Map<string, Promise<boolean>>
