import {
  FieldBase,
  MyInfoableFieldBase,
  MyInfoAttribute,
  MyInfoField,
} from '~shared/types'

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
export type MyInfoFieldWithMeta<T extends MyInfoField = MyInfoField> = T &
  MyInfoPreviewMeta

// Type for MyInfo meta information shown on the editor sidebar
// The data here is used for visual feedback to the user
export type MyInfoPreviewMeta = {
  dataSource: MyInfoDataSource[]
  verifiedFor: {
    [K in VerifiedFor]: boolean
  }
  details: string
}

// Type that has field level meta information (eg: validation)
// This is used to set sensible defaults for MyInfo fields
export type MyInfoFieldMeta<T extends MyInfoableFieldBase> = Omit<
  T,
  keyof FieldBase
>

export type MyInfoUnimplementedTypes =
  // Contact section
  | MyInfoAttribute.MailingAddress
  | MyInfoAttribute.BillingAddress
  | MyInfoAttribute.HomeNo
  // Particulars section
  | MyInfoAttribute.HighestEducation
  | MyInfoAttribute.SchoolName
  | MyInfoAttribute.YearOfGraduation
  | MyInfoAttribute.WorkpassType
  | MyInfoAttribute.EmploymentSector
  // Family (Children) section
  | MyInfoAttribute.ChildrenBirthCertificateNumber
  | MyInfoAttribute.ChildrenName
  | MyInfoAttribute.ChildrenGender
  | MyInfoAttribute.ChildrenDateOfBirth
  | MyInfoAttribute.ChildrenLifeStatus
  | MyInfoAttribute.ChildrenRace
  | MyInfoAttribute.ChildrenCountryOfBirth
  | MyInfoAttribute.ChildrenResidentialStatus
  | MyInfoAttribute.ChildrenNationality
  // Income section
  | MyInfoAttribute.CPFAccountBalance
  | MyInfoAttribute.CPFContributionHistory
  | MyInfoAttribute.NoticeOfAssessment
  | MyInfoAttribute.OwnershipOfPrivateResidentialProperty

export type MyInfoImplementedTypes = Exclude<
  MyInfoAttribute,
  MyInfoUnimplementedTypes
>
