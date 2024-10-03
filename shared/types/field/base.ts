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
  CountryRegion = 'country_region',
  YesNo = 'yes_no',
  Checkbox = 'checkbox',
  Radio = 'radiobutton',
  Attachment = 'attachment',
  Date = 'date',
  Rating = 'rating',
  Nric = 'nric',
  Table = 'table',
  Uen = 'uen',
  Children = 'children',
}

/**
 * Contains field types where the answer property is a string type, includes enums that evaluate to string.
 */
export enum StringAnswerResponseFieldV3 {
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
  CountryRegion = 'country_region',
  YesNo = 'yes_no',
  Radio = 'radiobutton',
  Date = 'date',
  Rating = 'rating',
  Nric = 'nric',
  Uen = 'uen',
}

/**
 * Contains field types where the answer is a generic string type
 */
export enum GenericStringAnswerResponseFieldV3 {
  Number = 'number',
  Decimal = 'decimal',
  ShortText = 'textfield',
  LongText = 'textarea',
  HomeNo = 'homeno',
  Dropdown = 'dropdown',
  Rating = 'rating',
  Nric = 'nric',
  Uen = 'uen',
  Date = 'date',
  CountryRegion = 'country_region',
}

export enum MyInfoAttribute {
  Name = 'name',
  PassportNumber = 'passportnumber',
  RegisteredAddress = 'regadd',
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
  DateOfBirth = 'dob',
  PassportExpiryDate = 'passportexpirydate',
  MarriageDate = 'marriagedate',
  DivorceDate = 'divorcedate',
  WorkpassStatus = 'workpassstatus',
  WorkpassExpiryDate = 'workpassexpirydate',
  ChildrenBirthRecords = 'childrenbirthrecords',
  // Children fields. MAKE SURE TO KEEP IN SYNC WITH MyInfoChildAttributes BELOW.
  ChildName = 'childname',
  ChildBirthCertNo = 'childbirthcertno',
  ChildDateOfBirth = 'childdateofbirth',
  ChildVaxxStatus = 'childvaxxstatus',
  ChildGender = 'childgender',
  ChildRace = 'childrace',
  ChildSecondaryRace = 'childsecondaryrace',
}

// We need to write this manually otherwise TS merges the names and keys
export enum MyInfoChildAttributes {
  ChildName = 'childname',
  ChildBirthCertNo = 'childbirthcertno',
  ChildDateOfBirth = 'childdateofbirth',
  ChildVaxxStatus = 'childvaxxstatus',
  ChildGender = 'childgender',
  ChildRace = 'childrace',
  ChildSecondaryRace = 'childsecondaryrace',
}

export type AllowedMyInfoFieldOption = Exclude<
  MyInfoAttribute,
  | MyInfoAttribute.ChildName
  | MyInfoAttribute.ChildBirthCertNo
  | MyInfoAttribute.ChildDateOfBirth
  | MyInfoAttribute.ChildVaxxStatus
  | MyInfoAttribute.ChildGender
  | MyInfoAttribute.ChildRace
  | MyInfoAttribute.ChildSecondaryRace
>

export type MyInfoChildData = Partial<{
  [key in MyInfoChildAttributes]: string[]
}>

export type AllowMyInfoBase = {
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

export type MyInfoableFieldBase = FieldBase & AllowMyInfoBase
