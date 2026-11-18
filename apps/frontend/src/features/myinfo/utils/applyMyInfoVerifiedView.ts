import {
  MYINFO_ATTRIBUTE_MAP,
  MyInfoVerifiedType,
} from 'formsg-shared/constants/field/myinfo'
import {
  BasicField,
  FormFieldDto,
  MyInfoFormField,
} from 'formsg-shared/types/field'

import { isMyInfo } from './isMyInfo'

export const applyMyInfoVerifiedView =
  (type: MyInfoVerifiedType) =>
  (field: FormFieldDto): MyInfoFormField => {
    const isRecordPicker = field.fieldType === BasicField.Children
    if (!isMyInfo(field) || isRecordPicker) return field
    return MYINFO_ATTRIBUTE_MAP[field.myInfo.attr]?.verified.includes(type)
      ? { ...field, disabled: true }
      : { ...field, fieldValue: '' }
  }
