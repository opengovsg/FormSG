import { format, parse } from 'date-fns'

import { DATE_PARSE_FORMAT, MYINFO_DATE_FORMAT } from '~shared/constants/dates'
import { BasicField, MyInfoPrefilledFormField } from '~shared/types'

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
      return format(
        parse(fieldValue, MYINFO_DATE_FORMAT, new Date()),
        DATE_PARSE_FORMAT,
      )
    default:
      return fieldValue
  }
}
