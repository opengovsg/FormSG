import { BasicField, SectionFieldBase } from 'formsg-shared/types'

import { IFieldSchema } from './baseField'

export interface ISectionFieldSchema extends SectionFieldBase, IFieldSchema {
  fieldType: BasicField.Section
}
