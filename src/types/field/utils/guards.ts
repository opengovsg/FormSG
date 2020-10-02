/* Type guards */
import { ISectionFieldSchema } from 'src/types/field'
import { IFieldSchema } from 'src/types/field/baseField'

export const isSectionField = (
  formField: IFieldSchema,
): formField is ISectionFieldSchema => {
  return formField.fieldType === 'section'
}
