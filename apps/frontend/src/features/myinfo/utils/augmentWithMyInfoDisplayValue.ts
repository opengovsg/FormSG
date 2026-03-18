import { MYINFO_ATTRIBUTE_MAP } from 'formsg-shared/constants/field/myinfo'
import { FormFieldDto, MyInfoFormField } from 'formsg-shared/types'

import { isMyInfo } from './isMyInfo'

export const augmentWithMyInfoDisplayValue = (
  field: FormFieldDto,
): MyInfoFormField => {
  if (!isMyInfo(field)) return field

  const myInfoBlock = MYINFO_ATTRIBUTE_MAP[field.myInfo.attr]
  return { ...field, fieldValue: myInfoBlock.previewValue }
}
