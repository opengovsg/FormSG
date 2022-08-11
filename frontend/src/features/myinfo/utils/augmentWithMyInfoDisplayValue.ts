import { keyBy } from 'lodash'

import { types as myInfoTypeArray } from '~shared/constants/field/myinfo'
import { FormFieldDto, MyInfoFormField } from '~shared/types'

import { isMyInfo } from './isMyInfo'

const MAP_ATTR_TO_NAME = keyBy(myInfoTypeArray, 'name')

export const augmentWithMyInfoDisplayValue = (
  field: FormFieldDto,
): MyInfoFormField => {
  if (!isMyInfo(field)) return field

  const myInfoBlock = MAP_ATTR_TO_NAME[field.myInfo.attr]
  return {
    ...field,
    fieldValue: myInfoBlock.previewValue,
    // Leave default as false, same as in MyInfoData class
    disabled: myInfoBlock.previewIsDisabled ?? false,
  }
}
