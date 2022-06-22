import { keyBy } from 'lodash'

import { types as myInfoTypeArray } from '~shared/constants/field/myinfo'
import { BasicField, FormFieldDto, MyInfoFormField } from '~shared/types/field'

import { isMyInfo } from './isMyInfo'

const MAP_ATTR_TO_NAME = keyBy(myInfoTypeArray, 'name')

export const isMyInfoFormField = (
  field: FormFieldDto,
): field is MyInfoFormField => {
  return isMyInfo(field) && (field as MyInfoFormField).fieldValue !== undefined
}

// Making a copy by destructuring so original object does not get affected.
export const augmentWithMyInfo = ({
  ...field
}: FormFieldDto): MyInfoFormField => {
  if (!isMyInfo(field)) return field

  const myInfoBlock = MAP_ATTR_TO_NAME[field.myInfo.attr]

  switch (field.fieldType) {
    case BasicField.Dropdown: {
      return {
        ...field,
        fieldValue: myInfoBlock.prefilledValue,
        fieldOptions: myInfoBlock.fieldOptions ?? [],
      }
    }
    default: {
      return {
        ...field,
        fieldValue: myInfoBlock.prefilledValue,
      }
    }
  }
}
