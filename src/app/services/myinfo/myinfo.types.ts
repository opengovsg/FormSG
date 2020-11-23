import { IFieldSchema, IMyInfo, MyInfoAttribute } from '../../../types'
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

export type MyInfoComparePromises = Map<
  { fieldId: string; attr: MyInfoAttribute },
  Promise<boolean>
>
