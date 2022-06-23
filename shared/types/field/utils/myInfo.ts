import { MyInfoPrefilledFormField, MyInfoFormField } from '../index'

export const isMyInfoPrefilledFormField = (
  possiblyPrefilledMyInfoField: MyInfoFormField,
): possiblyPrefilledMyInfoField is MyInfoPrefilledFormField => {
  return !!possiblyPrefilledMyInfoField.fieldValue
}
