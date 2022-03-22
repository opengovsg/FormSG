import { keyBy } from 'lodash'

import { types as myInfoTypeArray } from '~shared/constants/field/myinfo'
import { BasicField, FormFieldDto, MyInfoFormField } from '~shared/types/field'

const MAP_ATTR_TO_NAME = keyBy(myInfoTypeArray, 'name')

// Making a copy by destructuring so original object does not get affected.
export const augmentWithMyInfo = ({
  ...field
}: FormFieldDto): MyInfoFormField => {
  // Only dropdown fields have augmented options for now.
  switch (field.fieldType) {
    case BasicField.Dropdown: {
      // No need to augment if no MyInfo attribute
      if (!field.myInfo?.attr) return field
      const myInfoBlock = MAP_ATTR_TO_NAME[field.myInfo.attr]
      field.fieldOptions = myInfoBlock.fieldOptions ?? []
      return field
    }
    default:
      return field
  }
}
