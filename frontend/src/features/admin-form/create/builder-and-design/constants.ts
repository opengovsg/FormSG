import { keyBy } from 'lodash'

import { types as MYINFO_TYPE_CONSTANTS } from '~shared/constants/field/myinfo'
import {
  BasicField,
  DateFieldBase,
  DropdownFieldBase,
  MobileFieldBase,
  MyInfoAttribute,
  ShortTextFieldBase,
} from '~shared/types/field'

import { MyInfoFieldMeta } from '~features/myinfo/types'

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
  BasicField.CountryRegion,
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

export const MYINFO_FIELDS_ORDERED: MyInfoAttribute[] = [
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
  MyInfoAttribute.MobileNo,
  // Particulars section
  MyInfoAttribute.Occupation,
  MyInfoAttribute.Employment,
  MyInfoAttribute.WorkpassStatus,
  MyInfoAttribute.WorkpassExpiryDate,
  // Family (Marriage) section
  MyInfoAttribute.Marital,
  MyInfoAttribute.CountryOfMarriage,
  MyInfoAttribute.MarriageCertNo,
  MyInfoAttribute.MarriageDate,
  MyInfoAttribute.DivorceDate,
]

export const MYINFO_FIELD_CONSTANTS = keyBy(MYINFO_TYPE_CONSTANTS, 'name')

export const MYINFO_TEXTFIELD_META: MyInfoFieldMeta<ShortTextFieldBase> = {
  ValidationOptions: {
    selectedValidation: null,
    customVal: null,
  },
}

export const MYINFO_DROPDOWNFIELD_META: MyInfoFieldMeta<DropdownFieldBase> = {
  fieldOptions: [],
}
export const MYINFO_MOBILEFIELD_META: MyInfoFieldMeta<MobileFieldBase> = {
  allowIntlNumbers: false,
  isVerifiable: false,
}

export const MYINFO_DATEFIELD_META: MyInfoFieldMeta<DateFieldBase> = {
  dateValidation: {
    customMaxDate: null,
    customMinDate: null,
    selectedDateValidation: null,
  },
}

export const CREATE_PAGE_FIELDS_ORDERED = BASIC_FIELDS_ORDERED.slice(0, 3)
export const CREATE_FIELD_FIELDS_ORDERED = BASIC_FIELDS_ORDERED.slice(3)

export const CREATE_MYINFO_PERSONAL_FIELDS_ORDERED =
  MYINFO_FIELDS_ORDERED.slice(0, 13)

export const CREATE_MYINFO_CONTACT_FIELDS_ORDERED = MYINFO_FIELDS_ORDERED.slice(
  13,
  15,
)

export const CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED =
  MYINFO_FIELDS_ORDERED.slice(15, 19)

export const CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED =
  MYINFO_FIELDS_ORDERED.slice(19, 24)

export const CREATE_PAGE_DROP_ID = 'create-fields-page'
export const CREATE_FIELD_DROP_ID = 'create-fields-field'

export const CREATE_MYINFO_PERSONAL_DROP_ID = 'create-myinfo-personal'

export const CREATE_MYINFO_CONTACT_DROP_ID = 'create-myinfo-drop'

export const CREATE_MYINFO_PARTICULARS_DROP_ID = 'create-myinfo-particulars'

export const CREATE_MYINFO_MARRIAGE_DROP_ID = 'create-myinfo-marriage'
export const FIELD_LIST_DROP_ID = 'formFieldList'
export const PENDING_CREATE_FIELD_ID = 'FIELD-PENDING-CREATION'

export enum FieldListTabIndex {
  Basic,
  MyInfo,
}
