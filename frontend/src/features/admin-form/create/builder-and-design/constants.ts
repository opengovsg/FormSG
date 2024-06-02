import {
  BasicField,
  ChildrenCompoundFieldBase,
  DateFieldBase,
  DropdownFieldBase,
  MobileFieldBase,
  MyInfoAttribute,
  MyInfoChildAttributes,
  ShortTextFieldBase,
} from '~shared/types/field'

import { MyInfoFieldMeta } from '~features/myinfo/types'

import { MYINFO_FIELD_TO_DRAWER_META } from '../constants'

export const BASIC_FIELDS_ORDERED = [
  BasicField.ShortText,
  BasicField.LongText,
  BasicField.Radio,
  BasicField.Checkbox,
  BasicField.Dropdown,
  BasicField.CountryRegion,
  BasicField.Section,
  BasicField.Statement,
  BasicField.YesNo,
  BasicField.Rating,
  BasicField.Email,
  BasicField.Mobile,
  BasicField.HomeNo,
  BasicField.Date,
  BasicField.Image,
  BasicField.Table,
  BasicField.Attachment,
  BasicField.Number,
  BasicField.Decimal,
  BasicField.Nric,
  BasicField.Uen,
]

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

export const MYINFO_CHILDRENFIELD_META: MyInfoFieldMeta<ChildrenCompoundFieldBase> =
  {
    childrenSubFields: [MyInfoChildAttributes.ChildName],
    allowMultiple: false,
  }

export const CREATE_MYINFO_PERSONAL_FIELDS_ORDERED = [
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
]

export const CREATE_MYINFO_CONTACT_FIELDS_ORDERED = [
  MyInfoAttribute.RegisteredAddress,
  MyInfoAttribute.MobileNo,
]

export const CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED = [
  MyInfoAttribute.Occupation,
  MyInfoAttribute.Employment,
  MyInfoAttribute.WorkpassStatus,
  MyInfoAttribute.WorkpassExpiryDate,
]

export const CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED = [
  MyInfoAttribute.Marital,
  MyInfoAttribute.CountryOfMarriage,
  MyInfoAttribute.MarriageCertNo,
  MyInfoAttribute.MarriageDate,
  MyInfoAttribute.DivorceDate,
]

export const CREATE_MYINFO_CHILDREN_FIELDS_ORDERED = [
  MyInfoAttribute.ChildrenBirthRecords,
]

export const CREATE_MYINFO_DRIVING_LICENCE_FIELDS_ORDERED = [
  MyInfoAttribute.DrivingLicenceComStatus,
  MyInfoAttribute.DrivingLicenceDisqualificationStartDate,
]

export const CREATE_FIELD_DROP_ID = 'create-fields-field'

export const CREATE_MYINFO_PERSONAL_DROP_ID = 'create-myinfo-personal'

export const CREATE_MYINFO_CONTACT_DROP_ID = 'create-myinfo-drop'

export const CREATE_MYINFO_PARTICULARS_DROP_ID = 'create-myinfo-particulars'

export const CREATE_MYINFO_MARRIAGE_DROP_ID = 'create-myinfo-marriage'

export const CREATE_MYINFO_CHILDREN_DROP_ID = 'create-myinfo-children'

export const CREATE_MYINFO_DRIVING_LICENCE_DROP_ID =
  'create-myinfo-driving-licence'

export const FIELD_LIST_DROP_ID = 'formFieldList'
export const PENDING_CREATE_FIELD_ID = 'FIELD-PENDING-CREATION'

export enum FieldListTabIndex {
  Basic = 0,
  MyInfo,
  Payments,
}

export const CREATE_MYINFO_CHILDREN_SUBFIELDS_OPTIONS: {
  value: MyInfoChildAttributes
  label: string
}[] = Object.values(MyInfoChildAttributes)
  .filter((e) => e !== MyInfoChildAttributes.ChildName)
  .map((value) => {
    return {
      value,
      label: MYINFO_FIELD_TO_DRAWER_META[value].label,
    }
  })
