import { BasicField, FormField, MyInfoField } from '~shared/types'

export const isMyInfo = (field: FormField): field is MyInfoField => {
  switch (field.fieldType) {
    case BasicField.Date:
    case BasicField.Dropdown:
    case BasicField.HomeNo:
    case BasicField.Mobile:
    case BasicField.Number:
    case BasicField.ShortText:
      return !!field.myInfo
    default:
      return false
  }
}
