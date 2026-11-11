import { keyBy } from 'lodash'

import { types as myInfoTypeArray } from 'formsg-shared/constants/field/myinfo'
import {
  CorppassAttribute,
  FormFieldDto,
  MyInfoAttribute,
  MyInfoFormField,
} from 'formsg-shared/types'
import {
  getLoginIdentityAttr,
  LoginIdentityAttribute,
} from 'formsg-shared/utils/login-identity'

import { isMyInfo } from './isMyInfo'

const MAP_ATTR_TO_NAME = keyBy(myInfoTypeArray, 'name')

/** Sample login identities, shown in previews like MyInfo preview values. */
export const LOGIN_IDENTITY_PREVIEW_VALUES: Record<
  LoginIdentityAttribute,
  string
> = {
  [MyInfoAttribute.UinFin]: 'S0000001I',
  [CorppassAttribute.Uen]: '201912345A',
  [CorppassAttribute.Uid]: 'S0000001I',
}

export const augmentWithMyInfoDisplayValue = (
  field: FormFieldDto,
): MyInfoFormField => {
  const identityAttr = getLoginIdentityAttr(field)
  if (identityAttr) {
    return {
      ...field,
      fieldValue: LOGIN_IDENTITY_PREVIEW_VALUES[identityAttr],
    } as MyInfoFormField
  }
  if (!isMyInfo(field)) return field

  const myInfoBlock = MAP_ATTR_TO_NAME[field.myInfo.attr]
  return { ...field, fieldValue: myInfoBlock.previewValue }
}
