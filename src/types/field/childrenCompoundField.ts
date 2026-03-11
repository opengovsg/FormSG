import {
  BasicField,
  ChildrenCompoundFieldBase,
  MyInfoChildAttributes,
} from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface IChildrenCompoundFieldSchema
  extends ChildrenCompoundFieldBase, IFieldSchema {
  fieldType: BasicField.Children
  childrenSubFields: MyInfoChildAttributes[]
  allowMultiple: boolean
}
