import { MyInfoableFieldBase } from '../base'
import { FormField } from '../index'

export const enum VerifiedFor {
  Singaporeans = 'singaporeans',
  PermanentResidents = 'pr',
  ForeignersWithSingpass = 'singpassforeigners',
}

export const enum MyInfoDataSource {
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
export type MyInfoField<T extends FormField = FormField> = T &
  MyInfoableFieldBase & {
    description: string
    dataSource: MyInfoDataSource[]
    verifiedFor: {
      [K in VerifiedFor]: boolean
    }
  }
