import { keyBy } from 'lodash'

import { types as myInfoTypeArray } from '~shared/constants/field/myinfo'
import {
  BasicField,
  FormFieldDto,
  MyInfoField,
  MyInfoFormField,
} from '~shared/types/field'

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

// use immer array mutation pattern
export const addMyInfo = (draftBuilderFields: FormFieldDto[]): void => {
  for (let i = 0; i < draftBuilderFields.length; i++) {
    if (
      draftBuilderFields[i].fieldType === BasicField.Dropdown &&
      (draftBuilderFields[i] as MyInfoField).myInfo?.attr
    ) {
      const myInfoBlock =
        MAP_ATTR_TO_NAME[(draftBuilderFields[i] as MyInfoField).myInfo.attr]
      draftBuilderFields[i] = {
        ...draftBuilderFields[i],
        fieldOptions: myInfoBlock.fieldOptions ?? [],
      }
    }
  }
}
