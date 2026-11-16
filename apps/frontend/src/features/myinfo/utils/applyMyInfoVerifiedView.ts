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

/**
 * Shows a Myinfo field in preview as this type of respondent sees it: verified
 * values locked, the rest blank. Children fields keep their own record rules.
 */
export const applyMyInfoVerifiedView =
  (type: MyInfoVerifiedType) =>
  (field: FormFieldDto): MyInfoFormField => {
    if (!isMyInfo(field) || field.fieldType === BasicField.Children) {
      return field
    }
    return MYINFO_ATTRIBUTE_MAP[field.myInfo.attr]?.verified.includes(type)
      ? { ...field, disabled: true }
      : { ...field, fieldValue: '' }
  }
