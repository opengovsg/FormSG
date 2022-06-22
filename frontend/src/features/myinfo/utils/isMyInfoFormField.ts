import { FormFieldDto, MyInfoFormField } from '~shared/types'

import { isMyInfo } from './isMyInfo'

export const isMyInfoFormField = (
  field: FormFieldDto,
): field is MyInfoFormField => {
  return isMyInfo(field) && (field as MyInfoFormField).fieldValue !== undefined
}
