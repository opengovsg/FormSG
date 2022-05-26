import { BasicField } from '../base'
import { FormField, MyInfoField } from '..'

export enum VerifiedFor {
  Singaporeans = 'singaporeans',
  PermanentResidents = 'pr',
  ForeignersWithSingpass = 'singpassforeigners',
}

export enum MyInfoDataSource {
  HDB = 'Housing Development Board',
  ICA = 'Immigration & Checkpoints Authority',
  MOM = 'Ministry of Manpower',
  URA = 'Urban Redevelopment Authority',
  User = 'User-provided',
  MSFD = 'Ministry of Social and Family Development',
}

// Type for MyInfo field within the editor view
// A MyInfo field has UI related data tagged to it (description etc)
// And it wraps a specific field type on public forms that is prefilled
export type MyInfoFieldWithMeta<T extends MyInfoField = MyInfoField> = T & {
  dataSource: MyInfoDataSource[]
  verifiedFor: {
    [K in VerifiedFor]: boolean
  }
}

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
