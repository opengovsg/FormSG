import keyBy from 'lodash/keyBy'
import {
  BasicField,
  MyInfoAttribute,
  MyInfoChildVaxxStatus,
  MyInfoField,
} from '../../../types/field'
import { myInfoCountries } from './myinfo-countries'
import { myInfoDialects } from './myinfo-dialects'
import { myInfoNationalities } from './myinfo-nationalities'
import { myInfoOccupations } from './myinfo-occupations'
import { myInfoRaces } from './myinfo-races'
import { myInfoHousingTypes } from './myinfo-housing-types'
import { myInfoHdbTypes } from './myinfo-hdb-types'

export * from './myinfo-countries'
export * from './myinfo-dialects'
export * from './myinfo-nationalities'
export * from './myinfo-occupations'
export * from './myinfo-races'
export * from './myinfo-hdb-types'
export * from './myinfo-housing-types'

export type MyInfoVerifiedType = 'SG' | 'PR' | 'F'

export type MyInfoFieldBlock = {
  name: MyInfoAttribute
  value: string
  category: string
  verified: MyInfoVerifiedType[]
  source: string
  description: string
  fieldType: MyInfoField['fieldType']
  fieldOptions?: string[]
  ValidationOptions?: Record<string, unknown>
  // NOTE: This refers to the default value shown in admin form preview
  // for MyInfo forms. The running joke is that this is the personal
  // details of Phua Chu Kang, a famous singaporean sitcom.
  previewValue: string
}

export const types: MyInfoFieldBlock[] = [
  {
    name: MyInfoAttribute.Name,
    value: 'Name',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The registered name of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.ShortText,
    previewValue: 'PHUA CHU KANG',
  },
  {
    name: MyInfoAttribute.Sex,
    value: 'Sex',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The sex of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['FEMALE', 'MALE', 'UNKNOWN'],
    previewValue: 'MALE',
  },
  {
    name: MyInfoAttribute.DateOfBirth,
    value: 'Date of birth',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The registered date of birth of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Date,
    previewValue: '1965-02-23',
  },
  {
    name: MyInfoAttribute.Race,
    value: 'Race',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The race of the form-filler. This field is verified by ICA for Singaporean/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoRaces,
    previewValue: 'CHINESE',
  },
  {
    name: MyInfoAttribute.Nationality,
    value: 'Nationality',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The nationality of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoNationalities,
    previewValue: 'SINGAPORE CITIZEN',
  },
  {
    name: MyInfoAttribute.BirthCountry,
    value: 'Birth country',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The birth country of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoCountries,
    previewValue: 'SINGAPORE',
  },
  {
    name: MyInfoAttribute.ResidentialStatus,
    value: 'Residential Status',
    category: 'personal',
    verified: ['SG', 'PR'],
    source: 'Immigration and Checkpoints Authority',
    description: 'The residential status of the form-filler.',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['ALIEN', 'CITIZEN', 'NOT APPLICABLE', 'PR', 'UNKNOWN'],
    previewValue: 'CITIZEN',
  },
  {
    name: MyInfoAttribute.Dialect,
    value: 'Dialect',
    category: 'personal',
    verified: ['SG', 'PR'],
    source: 'Immigration and Checkpoints Authority',
    description: 'The dialect group of the form-filler.',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoDialects,
    previewValue: 'HOKKIEN',
  },
  {
    name: MyInfoAttribute.HousingType,
    value: 'Housing type',
    category: 'personal',
    verified: ['SG', 'PR'],
    source: 'Housing Development Board / Urban Redevelopment Authority',
    description:
      'The type of housing that the form-filler lives in. This information is verified by HDB for public housing, and by URA for private housing.',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoHousingTypes,
    previewValue: 'DETACHED HOUSE',
  },
  {
    name: MyInfoAttribute.HdbType,
    value: 'HDB type',
    category: 'personal',
    verified: ['SG', 'PR'],
    source: 'Housing Development Board',
    description: 'The type of HDB flat that the form-filler lives in.',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoHdbTypes,
    previewValue: 'EXECUTIVE FLAT (HDB)',
  },
  {
    name: MyInfoAttribute.PassportNumber,
    value: 'Passport number',
    category: 'personal',
    verified: ['SG'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The passport number of the form-filler.',
    fieldType: BasicField.ShortText,
    previewValue: 'E1234567X',
  },
  {
    name: MyInfoAttribute.PassportExpiryDate,
    value: 'Passport expiry date',
    category: 'personal',
    verified: ['SG'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The passport expiry date of the form-filler.',
    fieldType: BasicField.Date,
    previewValue: '2022-02-23',
  },
  {
    name: MyInfoAttribute.Marital,
    value: 'Marital status',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'The marital status of the form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED'],
    previewValue: 'MARRIED',
  },
  {
    name: MyInfoAttribute.CountryOfMarriage,
    value: 'Country of marriage',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'The country of marriage of the form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoCountries,
    previewValue: 'SINGAPORE',
  },
  {
    name: MyInfoAttribute.RegisteredAddress,
    value: 'Registered address',
    category: 'contact',
    verified: ['SG', 'PR'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The registered address of the form-filler.',
    fieldType: BasicField.ShortText,
    previewValue: '411 CHUA CHU KANG AVE 3, #12-3, SINGAPORE 238823',
  },
  {
    name: MyInfoAttribute.Occupation,
    value: 'Occupation',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description:
      'The occupation of the form-filler. Verified for foreigners with Singpass only.',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoOccupations,
    previewValue: 'MANAGING DIRECTOR/CHIEF EXECUTIVE OFFICER',
  },
  {
    name: MyInfoAttribute.Employment,
    value: 'Name of employer',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description:
      "The name of the form-filler's employer. Verified for foreigners with Singpass only.",
    fieldType: BasicField.ShortText,
    previewValue: 'PCK PTE LTD',
  },
  {
    name: MyInfoAttribute.VehicleNo,
    value: 'Vehicle number',
    category: 'personal',
    verified: [],
    source: 'User-provided',
    description: 'The vehicle plate number of the form-filler.',
    fieldType: BasicField.ShortText,
    previewValue: 'SHA1234X',
  },
  {
    name: MyInfoAttribute.MarriageCertNo,
    value: 'Marriage cert. no.',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'The marriage certificate number of the form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.ShortText,
    previewValue: '123456789012345',
  },
  {
    name: MyInfoAttribute.MarriageDate,
    value: 'Marriage date',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'The date of marriage of the form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.Date,
    previewValue: '1999-02-02',
  },
  {
    name: MyInfoAttribute.DivorceDate,
    value: 'Divorce date',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'The date of divorce of the form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.Date,
    previewValue: '2007-01-10',
  },
  {
    name: MyInfoAttribute.WorkpassStatus,
    value: 'Workpass status',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description: 'The workpass application status of the foreigner.',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['Live', 'Approved'],
    previewValue: 'Live',
  },
  {
    name: MyInfoAttribute.WorkpassExpiryDate,
    value: 'Workpass expiry date',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description: 'The workpass expiry date of the form-filler.',
    fieldType: BasicField.Date,
    previewValue: '2023-01-23',
  },
  {
    name: MyInfoAttribute.MobileNo,
    value: 'Mobile number',
    category: 'contact',
    verified: [],
    source: 'User-provided',
    description: 'The mobile telephone number of the form-filler.',
    fieldType: BasicField.Mobile,
    previewValue: '98765432',
  },
  {
    name: MyInfoAttribute.ChildrenBirthRecords,
    value: 'Child records',
    category: 'children',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Health Promotion Board',
    description:
      'The data of the form-filler’s children. Only data of children below 21 years old will be available. Vaccination status is verified by HPB. All other data is verified by ICA.',
    fieldType: BasicField.Children,
    previewValue: 'Child 1',
  },
  {
    name: MyInfoAttribute.ChildName,
    value: "Child's name",
    category: 'children',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Health Promotion Board',
    description: 'Name',
    fieldType: BasicField.Children,
    previewValue: 'PHUA CHU KING',
  },
  {
    name: MyInfoAttribute.ChildBirthCertNo,
    value: "Child's birth certificte number",
    category: 'children',
    verified: [],
    source: 'Immigration & Checkpoints Authority',
    description: 'Birth certificate number',
    fieldType: BasicField.ShortText,
    previewValue: 'T1234567X',
  },
  {
    name: MyInfoAttribute.ChildDateOfBirth,
    value: "Child's date of birth",
    category: 'children',
    verified: [],
    source: 'Immigration & Checkpoints Authority',
    description: 'Date of birth',
    fieldType: BasicField.ShortText,
    previewValue: '2010-01-01',
  },
  {
    name: MyInfoAttribute.ChildGender,
    value: "Child's sex",
    category: 'children',
    verified: [],
    source: 'Immigration & Checkpoints Authority',
    description: 'Sex',
    fieldType: BasicField.ShortText,
    fieldOptions: ['FEMALE', 'MALE', 'UNKNOWN'],
    previewValue: 'MALE',
  },
  {
    name: MyInfoAttribute.ChildVaxxStatus,
    value: "Child's vaccination status",
    category: 'children',
    verified: [],
    source: 'Heath Promotion Board',
    description: 'Vaccination status',
    fieldType: BasicField.Dropdown,
    fieldOptions: Object.values(MyInfoChildVaxxStatus),
    previewValue: MyInfoChildVaxxStatus.ONEM3D,
  },
  {
    name: MyInfoAttribute.ChildRace,
    value: "Child's race",
    category: 'children',
    verified: [],
    source: 'Immigration & Checkpoints Authority',
    description: 'Race',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoRaces,
    previewValue: 'CHINESE',
  },
  {
    name: MyInfoAttribute.ChildSecondaryRace,
    value: "Child's secondary race",
    category: 'children',
    verified: [],
    source: 'Immigration & Checkpoints Authority',
    description: 'Secondary race',
    fieldType: BasicField.Dropdown,
    fieldOptions: myInfoRaces,
    previewValue: 'CHINESE',
  },
]

export const MYINFO_ATTRIBUTE_MAP = keyBy(types, 'name')
