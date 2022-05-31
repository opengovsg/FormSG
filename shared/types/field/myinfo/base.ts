import {
  BasicField,
  FieldBase,
  MyInfoableFieldBase,
  MyInfoAttribute,
  MyInfoDropdownTypes,
} from '../base'
import { FormField, FormFieldDto, MyInfoField } from '..'
import { Dictionary, keyBy } from 'lodash'
import { ShortTextFieldBase } from '../shortTextField'
import { DropdownFieldBase } from '../dropdownField'
import {
  MyInfoFieldBlock,
  MyInfoVerifiedType,
  types as MYINFO_TYPE_CONSTANTS,
} from '../../../constants/field/myinfo'
import { SetRequired } from 'type-fest'
import _ from 'lodash'
import { MobileFieldBase } from '../mobileField'
import { DateFieldBase } from '../dateField'

export const MYINFO_FIELD_CONSTANTS = keyBy(MYINFO_TYPE_CONSTANTS, 'name')

export enum VerifiedFor {
  Singaporeans = 'singaporeans',
  PermanentResidents = 'pr',
  ForeignersWithSingpass = 'singpassforeigners',
}

type VerifiedForMappings = {
  [K in VerifiedFor]: boolean
}

export enum MyInfoDataSource {
  HDB = 'Housing Development Board',
  ICA = 'Immigration & Checkpoints Authority',
  MOM = 'Ministry of Manpower',
  URA = 'Urban Redevelopment Authority',
  User = 'User-provided',
  MSFD = 'Ministry of Social and Family Development',
}

const MYINFO_VERIFICATION_TYPE_MAPPINGS: {
  [K in MyInfoVerifiedType]: VerifiedFor
} = {
  F: VerifiedFor.ForeignersWithSingpass,
  PR: VerifiedFor.PermanentResidents,
  SG: VerifiedFor.Singaporeans,
}

const extractVerifiedFor = (
  myInfoFieldType: MyInfoAttribute,
): VerifiedForMappings => {
  const verificationArray = MYINFO_FIELD_CONSTANTS[myInfoFieldType]['verified']
  const baseVerifiedFor = {
    [VerifiedFor.Singaporeans]: false,
    [VerifiedFor.PermanentResidents]: false,
    [VerifiedFor.ForeignersWithSingpass]: false,
  }

  verificationArray.forEach((element) => {
    baseVerifiedFor[MYINFO_VERIFICATION_TYPE_MAPPINGS[element]] = true
  })

  return baseVerifiedFor
}

const convertMyInfoDataSource = (source: string): MyInfoDataSource[] => {
  return source
    .split('/')
    .map((dataSource) => dataSource.trim() as MyInfoDataSource)
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

export const extendWithMyInfo = (
  field: MyInfoField & {
    _id?: FormFieldDto['_id']
  },
): MyInfoPreviewMeta => {
  return {
    dataSource: convertMyInfoDataSource(
      MYINFO_FIELD_CONSTANTS[field.myInfo.attr].source,
    ),
    verifiedFor: extractVerifiedFor(field.myInfo.attr),
    details: MYINFO_FIELD_CONSTANTS[field.myInfo.attr].description,
  }
}

export const myInfoTextFieldMeta: MyInfoFieldMeta<ShortTextFieldBase> = {
  ValidationOptions: {
    selectedValidation: null,
    customVal: null,
  },
}

export const getMyInfoDropdownOptions = (
  myInfoAttribute: MyInfoDropdownTypes,
): MyInfoFieldMeta<DropdownFieldBase> => {
  const myInfoDropdownFields = _(MYINFO_FIELD_CONSTANTS)
    .filter(({ fieldOptions }) => !!fieldOptions)
    .keyBy('name')
    .value() as Dictionary<SetRequired<MyInfoFieldBlock, 'fieldOptions'>>

  return {
    fieldOptions: myInfoDropdownFields[myInfoAttribute].fieldOptions,
  }
}

export const myInfoDropdownFieldMeta: MyInfoFieldMeta<DropdownFieldBase> = {
  fieldOptions: [],
}
export const myInfoMobileFieldMeta: MyInfoFieldMeta<MobileFieldBase> = {
  allowIntlNumbers: false,
  isVerifiable: false,
}

export const myInfoDateFieldMeta: MyInfoFieldMeta<DateFieldBase> = {
  dateValidation: {
    customMaxDate: null,
    customMinDate: null,
    selectedDateValidation: null,
  },
}
