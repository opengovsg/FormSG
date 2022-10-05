import { BasicField, MyInfoPrefilledFormField } from '~shared/types'

type PrefilledMyInfoValue = string | { value: string }

export const extractPreviewValue = ({
  fieldType,
  fieldValue,
}: MyInfoPrefilledFormField): PrefilledMyInfoValue => {
  // NOTE: The mobile number field uses value?.value to inject the input.
  // Hence, we have to return an object in order for the mobile number field
  // to read the default value correctly.
  if (fieldType === BasicField.Mobile) {
    return {
      value: fieldValue,
    }
  }
  return fieldValue
}
