import { BasicField, SectionFieldBase } from '../../../shared/types/field'

import { IFieldSchema } from './baseField'

export { SectionFieldBase }
export interface ISectionFieldSchema extends SectionFieldBase, IFieldSchema {
  fieldType: BasicField.Section
}
