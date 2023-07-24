import { SetRequired } from 'type-fest'

import { ChildrenCompoundFieldBase } from '~shared/types'

export * from './EditMyInfoChildren'

export type ChildrenCompoundFieldMyInfo = SetRequired<
  ChildrenCompoundFieldBase,
  'myInfo'
>
