import { MyInfoVerifiedType } from 'formsg-shared/constants/field/myinfo'
import {
  BasicField,
  FormFieldDto,
  MyInfoFormField,
} from 'formsg-shared/types/field'
import { isMyInfoVerifiedFor } from 'formsg-shared/utils/myinfo-verified'

import { isMyInfo } from './isMyInfo'

/**
 * Shows a Myinfo field in preview as this type of respondent sees it after
 * logging in. A verified value is filled and locked. Anything else comes back
 * blank and editable. Children fields keep their own record rules.
 */
export const applyMyInfoVerifiedView =
  (type: MyInfoVerifiedType) =>
  (field: FormFieldDto): MyInfoFormField => {
    if (!isMyInfo(field) || field.fieldType === BasicField.Children) {
      return field
    }
    return isMyInfoVerifiedFor(field.myInfo.attr, type)
      ? { ...field, disabled: true }
      : { ...field, fieldValue: '' }
  }
