import { MyInfoFormField, MyInfoPrefilledFormField } from 'formsg-shared/types'

export const hasExistingFieldValue = (
  possiblyPrefilledMyInfoField: MyInfoFormField,
): possiblyPrefilledMyInfoField is MyInfoPrefilledFormField => {
  return !!possiblyPrefilledMyInfoField.fieldValue
}
