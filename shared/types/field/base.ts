export enum BasicField {
  Section = 'section',
  Statement = 'statement',
  Email = 'email',
  Mobile = 'mobile',
  HomeNo = 'homeno',
  Number = 'number',
  Decimal = 'decimal',
  Image = 'image',
  ShortText = 'textfield',
  LongText = 'textarea',
  Dropdown = 'dropdown',
  YesNo = 'yes_no',
  Checkbox = 'checkbox',
  Radio = 'radiobutton',
  Attachment = 'attachment',
  Date = 'date',
  Rating = 'rating',
  Nric = 'nric',
  Table = 'table',
  Uen = 'uen',
}

export enum MyInfoAttribute {
  Name = 'name',
  PassportNumber = 'passportnumber',
  RegisteredAddress = 'regadd',
  MailingAddress = 'mailadd',
  BillingAddress = 'billadd',
  // NOTE: This refers to the name of employer
  Employment = 'employment',
  VehicleNo = 'vehno',
  MarriageCertNo = 'marriagecertno',
  Sex = 'sex',
  Race = 'race',
  Dialect = 'dialect',
  Nationality = 'nationality',
  BirthCountry = 'birthcountry',
  ResidentialStatus = 'residentialstatus',
  HousingType = 'housingtype',
  HdbType = 'hdbtype',
  Marital = 'marital',
  CountryOfMarriage = 'countryofmarriage',
  Occupation = 'occupation',
  MobileNo = 'mobileno',
  HomeNo = 'homeno',
  DateOfBirth = 'dob',
  PassportExpiryDate = 'passportexpirydate',
  MarriageDate = 'marriagedate',
  DivorceDate = 'divorcedate',
  WorkpassType = 'workpasstype',
  WorkpassStatus = 'workpassstatus',
  WorkpassExpiryDate = 'workpassexpirydate',
  EmploymentSector = 'empsector',
  HighestEducation = 'highested',
  SchoolName = 'schname',
  YearOfGraduation = 'gradyr',
  ChildrenBirthCertificateNumber = 'childrenbirthcertno',
  ChildrenName = 'childrenname',
  ChildrenGender = 'childrengender',
  ChildrenDateOfBirth = 'childrendob',
  ChildrenLifeStatus = 'childrenlifestatus',
  ChildrenRace = 'childrenrace',
  ChildrenCountryOfBirth = 'childrencountryofbirth',
  ChildrenResidentialStatus = 'childrenresidentialstatus',
  ChildrenNationality = 'childrennationality',
  CPFAccountBalance = 'cpfaccbal',
  CPFContributionHistory = 'cpcontribhist',
  NoticeOfAssessment = 'noticeofassessment',
  OwnershipOfPrivateResidentialProperty = 'ownership',
}

export type MyInfoDropdownTypes =
  | MyInfoAttribute.Sex
  | MyInfoAttribute.Race
  | MyInfoAttribute.Nationality
  | MyInfoAttribute.BirthCountry
  | MyInfoAttribute.ResidentialStatus
  | MyInfoAttribute.Dialect
  | MyInfoAttribute.HousingType
  | MyInfoAttribute.HdbType
  | MyInfoAttribute.Occupation
  | MyInfoAttribute.WorkpassStatus
  | MyInfoAttribute.Marital
  | MyInfoAttribute.CountryOfMarriage

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

export type AllowMyInfoBase<T extends FieldBase = FieldBase> = T & {
  myInfo?: {
    attr: MyInfoAttribute
  }
}

export type VerifiableFieldBase = {
  isVerifiable: boolean
}

export type FieldBase = {
  globalId?: string
  title: string
  description: string
  required: boolean
  disabled: boolean
  fieldType: BasicField
}

export type MyInfoableFieldBase = AllowMyInfoBase
