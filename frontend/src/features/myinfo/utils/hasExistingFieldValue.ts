import { MyInfoFormField, MyInfoPrefilledFormField } from '~shared/types'

export const hasExistingFieldValue = (
  possiblyPrefilledMyInfoField: MyInfoFormField,
): possiblyPrefilledMyInfoField is MyInfoPrefilledFormField => {
  return !!possiblyPrefilledMyInfoField.fieldValue
}
