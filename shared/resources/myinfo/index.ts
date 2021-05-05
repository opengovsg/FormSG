import { BasicField, MyInfoAttribute } from '../../types/form'

import COUNTRIES from './myinfo-countries'
import DIALECTS from './myinfo-dialects'
import NATIONALITIES from './myinfo-nationalities'
import OCCUPATIONS from './myinfo-occupations'
import RACES from './myinfo-races'

type MyInfoVerifiedType = 'SG' | 'PR' | 'F'
interface IMyInfoFieldType {
  name: MyInfoAttribute
  value: string
  category: string
  verified: MyInfoVerifiedType[]
  source: string
  description: string
  fieldType: BasicField
  fieldOptions?: string[]
  ValidationOptions?: Record<string, unknown>
}

export const types: IMyInfoFieldType[] = [
  {
    name: MyInfoAttribute.Name,
    value: 'Name',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The registered name of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.ShortText,
  },
  {
    name: MyInfoAttribute.Sex,
    value: 'Gender',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The gender of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['FEMALE', 'MALE', 'UNKNOWN'],
  },
  {
    name: MyInfoAttribute.DateOfBirth,
    value: 'Date of birth',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The registered name of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Date,
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
    fieldOptions: RACES,
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
    fieldOptions: NATIONALITIES,
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
    fieldOptions: COUNTRIES,
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
  },
  {
    name: MyInfoAttribute.Dialect,
    value: 'Dialect',
    category: 'personal',
    verified: ['SG', 'PR'],
    source: 'Immigration and Checkpoints Authority',
    description: 'The dialect group of the form-filler.',
    fieldType: BasicField.Dropdown,
    fieldOptions: DIALECTS,
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
    fieldOptions: [
      'APARTMENT',
      'CONDOMINIUM',
      'DETACHED HOUSE',
      'EXECUTIVE CONDOMINIUM',
      'SEMI-DETACHED HOUSE',
      'TERRACE HOUSE',
    ],
  },
  {
    name: MyInfoAttribute.HdbType,
    value: 'HDB type',
    category: 'personal',
    verified: ['SG', 'PR'],
    source: 'Housing Development Board',
    description: 'The type of HDB flat that the form-filler lives in.',
    fieldType: BasicField.Dropdown,
    fieldOptions: [
      '1-ROOM FLAT (HDB)',
      '2-ROOM FLAT (HDB)',
      '3-ROOM FLAT (HDB)',
      '4-ROOM FLAT (HDB)',
      '5-ROOM FLAT (HDB)',
      'EXECUTIVE FLAT (HDB)',
      'STUDIO APARTMENT (HDB)',
    ],
  },
  {
    name: MyInfoAttribute.PassportNumber,
    value: 'Passport number',
    category: 'personal',
    verified: ['SG'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The passport number of the form-filler.',
    fieldType: BasicField.ShortText,
  },
  {
    name: MyInfoAttribute.PassportExpiryDate,
    value: 'Passport expiry date',
    category: 'personal',
    verified: ['SG'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The passport expiry date of the form-filler.',
    fieldType: BasicField.Date,
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
    fieldOptions: COUNTRIES,
  },
  {
    name: MyInfoAttribute.RegisteredAddress,
    value: 'Registered address',
    category: 'contact',
    verified: ['SG', 'PR'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The registered address of the form-filler.',
    fieldType: BasicField.ShortText,
  },
  {
    name: MyInfoAttribute.Occupation,
    value: 'Occupation',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description:
      'The occupation of the form-filler. Verified for foreigners with SingPass only.',
    fieldType: BasicField.Dropdown,
    fieldOptions: OCCUPATIONS,
  },
  {
    name: MyInfoAttribute.Employment,
    value: 'Name of employer',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description:
      "The name of the form-filler's employer. Verified for foreigners with SingPass only.",
    fieldType: BasicField.ShortText,
  },
  {
    name: MyInfoAttribute.VehicleNo,
    value: 'Vehicle number',
    category: 'personal',
    verified: [],
    source: 'User-provided',
    description: 'Vehicle plate number of the form-filler.',
    fieldType: BasicField.ShortText,
  },
  {
    name: MyInfoAttribute.MarriageCertNo,
    value: 'Marriage cert. no.',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'Marriage Certificate Number of form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.ShortText,
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
  },
  {
    name: MyInfoAttribute.WorkpassStatus,
    value: 'Workpass status',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description: 'Workpass application status of foreigner.',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['Live', 'Approved'],
  },
  {
    name: MyInfoAttribute.WorkpassExpiryDate,
    value: 'Workpass expiry date',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description: 'The workpass expiry date of the form-filler.',
    fieldType: BasicField.Date,
  },
  {
    name: MyInfoAttribute.MobileNo,
    value: 'Mobile number',
    category: 'contact',
    verified: [],
    source: 'User-provided',
    description: 'Mobile telephone number of form-filler.',
    fieldType: BasicField.Mobile,
  },
]
