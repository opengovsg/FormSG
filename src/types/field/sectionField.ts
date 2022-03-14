import { BasicField, SectionFieldBase } from '../../../shared/types'

import { IFieldSchema } from './baseField'

export interface ISectionFieldSchema extends SectionFieldBase, IFieldSchema {
  fieldType: BasicField.Section
}
