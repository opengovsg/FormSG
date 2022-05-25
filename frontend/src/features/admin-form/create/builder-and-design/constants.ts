import { BasicField, MyInfoAttribute } from '~shared/types/field'

export const BASIC_FIELDS_ORDERED = [
  // Page section
  BasicField.Section,
  BasicField.Statement,
  BasicField.Image,
  // Fields section
  BasicField.ShortText,
  BasicField.LongText,
  BasicField.Radio,
  BasicField.Checkbox,
  BasicField.Mobile,
  BasicField.Email,
  BasicField.HomeNo,
  BasicField.Dropdown,
  BasicField.YesNo,
  BasicField.Rating,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.Attachment,
  BasicField.Date,
  BasicField.Table,
  BasicField.Nric,
  BasicField.Uen,
]

export const MYINFO_FIELDS_ORDERED = [
  // Personal section
  MyInfoAttribute.Name,
  MyInfoAttribute.Sex,
  MyInfoAttribute.DateOfBirth,
  MyInfoAttribute.Race,
  MyInfoAttribute.Nationality,
  MyInfoAttribute.BirthCountry,
  MyInfoAttribute.ResidentialStatus,
  MyInfoAttribute.Dialect,
  MyInfoAttribute.HousingType,
  MyInfoAttribute.HdbType,
  MyInfoAttribute.PassportNumber,
  MyInfoAttribute.PassportExpiryDate,
  MyInfoAttribute.VehicleNo,
  // Contact section
  MyInfoAttribute.RegisteredAddress,
  MyInfoAttribute.MailingAddress,
  MyInfoAttribute.BillingAddress,
  MyInfoAttribute.MobileNo,
  MyInfoAttribute.HomeNo,
  // Particulars section
  MyInfoAttribute.HighestEducation,
  MyInfoAttribute.SchoolName,
  MyInfoAttribute.YearOfGraduation,
  MyInfoAttribute.Occupation,
  MyInfoAttribute.Employment,
  MyInfoAttribute.WorkpassType,
  MyInfoAttribute.WorkpassStatus,
  MyInfoAttribute.WorkpassExpiryDate,
  MyInfoAttribute.EmploymentSector,
  // Family (Marriage) section
  MyInfoAttribute.Marital,
  MyInfoAttribute.CountryOfMarriage,
  MyInfoAttribute.MarriageCertNo,
  MyInfoAttribute.MarriageDate,
  MyInfoAttribute.DivorceDate,
  // Family (Children) section
  MyInfoAttribute.ChildrenBirthCertificateNumber,
  MyInfoAttribute.ChildrenName,
  MyInfoAttribute.ChildrenGender,
  MyInfoAttribute.ChildrenDateOfBirth,
  MyInfoAttribute.ChildrenLifeStatus,
  MyInfoAttribute.ChildrenRace,
  MyInfoAttribute.ChildrenCountryOfBirth,
  MyInfoAttribute.ChildrenResidentialStatus,
  MyInfoAttribute.ChildrenNationality,
  // Income section
  MyInfoAttribute.CPFAccountBalance,
  MyInfoAttribute.CPFContributionHistory,
  MyInfoAttribute.NoticeOfAssessment,
  MyInfoAttribute.OwnershipOfPrivateResidentialProperty,
]

export const CREATE_PAGE_FIELDS_ORDERED = BASIC_FIELDS_ORDERED.slice(0, 3)
export const CREATE_FIELD_FIELDS_ORDERED = BASIC_FIELDS_ORDERED.slice(3)

export const CREATE_MYINFO_PERSONAL_FIELDS_ORDERED =
  MYINFO_FIELDS_ORDERED.slice(0, 13)

export const CREATE_MYINFO_CONTACT_FIELDS_ORDERED = MYINFO_FIELDS_ORDERED.slice(
  13,
  18,
)

export const CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED =
  MYINFO_FIELDS_ORDERED.slice(18, 27)

export const CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED =
  MYINFO_FIELDS_ORDERED.slice(27, 32)

export const CREATE_MYINFO_CHILDREN_FIELDS_ORDERED =
  MYINFO_FIELDS_ORDERED.slice(32, 41)

export const CREATE_MYINFO_INCOME_FIELDS_ORDERED =
  MYINFO_FIELDS_ORDERED.slice(41)

export const CREATE_PAGE_DROP_ID = 'create-fields-page'
export const CREATE_FIELD_DROP_ID = 'create-fields-field'

export const CREATE_MYINFO_PERSONAL_DROP_ID = 'create-myinfo-personal'

export const FIELD_LIST_DROP_ID = 'formFieldList'
export const PENDING_CREATE_FIELD_ID = 'FIELD-PENDING-CREATION'
