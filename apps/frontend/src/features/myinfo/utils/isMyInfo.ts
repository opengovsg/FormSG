import { BasicField, FormField, MyInfoField } from 'formsg-shared/types'

export const isMyInfo = (field: FormField): field is MyInfoField => {
  switch (field.fieldType) {
    case BasicField.Date:
    case BasicField.Dropdown:
    case BasicField.Mobile:
    case BasicField.ShortText:
    case BasicField.Children:
      return !!field.myInfo
    default:
      return false
  }
}
