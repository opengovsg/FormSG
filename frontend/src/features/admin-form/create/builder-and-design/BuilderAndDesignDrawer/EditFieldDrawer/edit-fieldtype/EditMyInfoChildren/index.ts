import { SetRequired } from 'type-fest'

import { ChildrenCompoundFieldBase } from 'formsg-shared/types'

export * from './EditMyInfoChildren'

export type ChildrenCompoundFieldMyInfo = SetRequired<
  ChildrenCompoundFieldBase,
  'myInfo'
>
