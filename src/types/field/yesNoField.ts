import { BasicField, YesNoFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { YesNoFieldBase }

export interface IYesNoFieldSchema extends YesNoFieldBase, IFieldSchema {
  fieldType: BasicField.YesNo
}
