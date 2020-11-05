import { MyInfoAttribute } from '@opengovsg/myinfo-gov-client'

import { IFieldSchema } from 'src/types'

export interface IPossiblyPrefilledField extends IFieldSchema {
  fieldValue?: string
}

export type MyInfoHashPromises = Partial<
  Record<MyInfoAttribute, Promise<string>>
>
