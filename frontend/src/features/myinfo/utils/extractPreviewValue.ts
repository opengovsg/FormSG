import { format, parse } from 'date-fns'

import { BasicField, MyInfoPrefilledFormField } from '~shared/types'

import { DATE_PARSE_FORMAT } from '~templates/Field/Date/DateField'

type PrefilledMyInfoValue = string | { value: string }

const MYINFO_DATE_FORMAT = 'yyyy-MM-dd'

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
