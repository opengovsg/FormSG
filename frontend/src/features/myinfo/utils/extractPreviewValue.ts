import { BasicField, MyInfoPrefilledFormField } from '~shared/types'
import { formatMyinfoDate } from '~shared/utils/dates'

type PrefilledMyInfoValue = string | { value: string }

export const extractPreviewValue = ({
  fieldType,
  fieldValue,
}: MyInfoPrefilledFormField): PrefilledMyInfoValue => {
  // NOTE: The mobile number field uses value?.value to inject the input.
  // Hence, we have to return an object in order for the mobile number field
  // to read the default value correctly.
  switch (fieldType) {
    case BasicField.Mobile:
      return {
        value: fieldValue,
      }
    case BasicField.Date:
      return formatMyinfoDate(fieldValue)
    default:
      return fieldValue
  }
}
