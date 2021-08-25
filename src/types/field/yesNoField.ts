import { BasicField, YesNoFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface IYesNoFieldSchema extends YesNoFieldBase, IFieldSchema {
  fieldType: BasicField.YesNo
}
