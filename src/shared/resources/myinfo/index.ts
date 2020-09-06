import { BasicField } from '../../../types'

import COUNTRIES from './myinfo-countries'
import DIALECTS from './myinfo-dialects'
import NATIONALITIES from './myinfo-nationalities'
import OCCUPATIONS from './myinfo-occupations'
import RACES from './myinfo-races'
import SCHOOLS from './myinfo-schools'

export type MyInfoFieldName =
  | 'name'
  | 'sex'
  | 'dob'
  | 'race'
  | 'nationality'
  | 'birthcountry'
  | 'residentialstatus'
  | 'dialect'
  | 'housingtype'
  | 'hdbtype'
  | 'passportnumber'
  | 'passportexpirydate'
  | 'marital'
  | 'edulevel'
  | 'countryofmarriage'
  | 'regadd'
  | 'mailadd'
  | 'billadd'
  | 'schoolname'
  | 'occupation'
  | 'employment'
  | 'vehno'
  | 'marriagecertno'
  | 'marriagedate'
  | 'divorcedate'
  | 'workpassstatus'
  | 'workpassexpirydate'
  | 'mobileno'
  | 'homeno'
  | 'gradyear'

type MyInfoVerifiedType = 'SG' | 'PR' | 'F'
interface IMyInfoFieldType {
  name: MyInfoFieldName
  value: string
  category: string
  verified: MyInfoVerifiedType[]
  source: string
  description: string
  fieldType: BasicField
  fieldOptions?: string[]
  ValidationOptions?: Record<string, unknown>
}

// TODO: Enable more MyInfo fields.
export const types: IMyInfoFieldType[] = [
  // Email fieldType
  // {
  //   name: 'email',
  //   value: 'Email',
  //   fieldType: 'email'
  // },
  {
    name: 'name',
    value: 'Name',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The registered name of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.ShortText,
  },
  {
    name: 'sex',
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
    name: 'dob',
    value: 'Date of birth',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The registered name of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Date,
  },
  {
    name: 'race',
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
    name: 'nationality',
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
    name: 'birthcountry',
    value: 'Birth country',
    category: 'personal',
    verified: ['SG', 'PR', 'F'],
    source: 'Immigration & Checkpoints Authority / Ministry of Manpower',
    description:
      'The birth country of the form-filler. This field is verified by ICA for Singaporeans/PRs & foreigners on Long-Term Visit Pass, and by MOM for Employment Pass holders.',
    fieldType: BasicField.Dropdown,
    fieldOptions: COUNTRIES,
  },
  // {
  //   name: 'secondaryrace',
  //   value: 'Race (Secondary)',
  //   category: "personal",
  //   fieldType: BasicField.Dropdown
  // },
  {
    name: 'residentialstatus',
    value: 'Residential Status',
    category: 'personal',
    verified: ['SG', 'PR'],
    source: 'Immigration and Checkpoints Authority',
    description: 'The residential status of the form-filler.',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['Alien', 'Citizen', 'NOT APPLICABLE', 'PR', 'Unknown'],
  },
  {
    name: 'dialect',
    value: 'Dialect',
    category: 'personal',
    verified: ['SG', 'PR'],
    source: 'Immigration and Checkpoints Authority',
    description: 'The dialect group of the form-filler.',
    fieldType: BasicField.Dropdown,
    fieldOptions: DIALECTS,
  },
  {
    name: 'housingtype',
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
    name: 'hdbtype',
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
    name: 'passportnumber',
    value: 'Passport number',
    category: 'personal',
    verified: ['SG'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The passport number of the form-filler.',
    fieldType: BasicField.ShortText,
  },
  {
    name: 'passportexpirydate',
    value: 'Passport expiry date',
    category: 'personal',
    verified: ['SG'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The passport expiry date of the form-filler.',
    fieldType: BasicField.Date,
  },
  {
    name: 'marital',
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
    name: 'edulevel',
    value: 'Highest education',
    category: 'employment_education',
    verified: [],
    source: 'User-provided',
    description: 'Highest education level of form-filler.',
    fieldType: BasicField.Dropdown,
    fieldOptions: [
      'NO FORMAL QUALIFICATION / PRE-PRIMARY / LOWER PRIMARY',
      'PRIMARY',
      'LOWER SECONDARY',
      'SECONDARY',
      'POST-SECONDARY (NON-TERTIARY): GENERAL & VOCATION',
      'POLYTECHNIC DIPLOMA',
      'PROFESSIONAL QUALIFICATION AND OTHER DIPLOMA',
      "BACHELOR'S OR EQUIVALENT",
      "POSTGRADUATE DIPLOMA / CERTIFICATE (EXCLUDING MASTER'S AND DOCTORATE)",
      "MASTER'S AND DOCTORATE OR EQUIVALENT",
      'MODULAR CERTIFICATION (NON-AWARD COURSES / NON-FULL QUALIFICATIONS)',
    ],
  },
  {
    name: 'countryofmarriage',
    value: 'Country of marriage',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'The country of marriage of the form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.Dropdown,
    fieldOptions: COUNTRIES,
  },
  // {
  //   name: 'householdincome',
  //   value: 'Household Income',
  //   category: "employment_education",
  //   verified: [],
  //   source: "User-provided"
  //   description: "",
  //   fieldType: BasicField.Dropdown,
  // },
  // {
  //   name: 'marriedname',
  //   value: 'Married Name',
  //   category: "family",
  //   fieldType: 'textfield'
  // },
  // {
  //   name: 'hanyupinyinname',
  //   value: 'Hanyu Pinyin Name',
  //   category: "personal",
  //   fieldType: 'textfield'
  // },
  // {
  //   name: 'aliasname',
  //   value: 'Alias Name',
  //   category: "personal",
  //   fieldType: 'textfield'
  // },
  // {
  //   name: 'hanyupinyinaliasname',
  //   value: 'Hanyu Pinyin Alias Name',
  //   category: "personal",
  //   fieldType: 'textfield'
  // },
  {
    name: 'regadd',
    value: 'Registered address',
    category: 'contact',
    verified: ['SG', 'PR'],
    source: 'Immigration & Checkpoints Authority',
    description: 'The registered address of the form-filler.',
    fieldType: BasicField.ShortText,
  },
  {
    name: 'mailadd',
    value: 'Mailing address',
    category: 'contact',
    verified: [],
    source: 'User-provided',
    description: 'The mailing address of the form-filler.',
    fieldType: BasicField.ShortText,
  },
  {
    name: 'billadd',
    value: 'Billing address',
    category: 'contact',
    verified: [],
    source: 'User-provided',
    description: 'The billing address of the form-filler.',
    fieldType: BasicField.ShortText,
  },
  {
    name: 'schoolname',
    value: 'School name',
    category: 'employment_education',
    verified: [],
    source: 'User-provided',
    description:
      'List of primary, secondary and tertiary educational institutions in Singapore. Does not include private or international educational institutions.',
    fieldType: BasicField.Dropdown,
    fieldOptions: SCHOOLS,
  },
  {
    name: 'occupation',
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
    name: 'employment',
    value: 'Name of employer',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description:
      "The name of the form-filler's employer. Verified for foreigners with SingPass only.",
    fieldType: BasicField.ShortText,
  },
  {
    name: 'vehno',
    value: 'Vehicle number',
    category: 'personal',
    verified: [],
    source: 'User-provided',
    description: 'Vehicle plate number of the form-filler.',
    fieldType: BasicField.ShortText,
  },
  {
    name: 'marriagecertno',
    value: 'Marriage cert. no.',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'Marriage Certificate Number of form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.ShortText,
  },
  {
    name: 'marriagedate',
    value: 'Marriage date',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'The date of marriage of the form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.Date,
  },
  {
    name: 'divorcedate',
    value: 'Divorce date',
    category: 'family',
    verified: [],
    source: 'Ministry of Social and Family Development',
    description:
      'The date of divorce of the form-filler. This field is treated as unverified, as data provided by MSF may be outdated in cases of marriages in a foreign country.',
    fieldType: BasicField.Date,
  },
  {
    name: 'workpassstatus',
    value: 'Workpass status',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description: 'Workpass application status of foreigner.',
    fieldType: BasicField.Dropdown,
    fieldOptions: ['Live', 'Approved'],
  },
  {
    name: 'workpassexpirydate',
    value: 'Workpass expiry date',
    category: 'employment_education',
    verified: ['F'],
    source: 'Ministry of Manpower',
    description: 'The workpass expiry date of the form-filler.',
    fieldType: BasicField.Date,
  },
  {
    name: 'mobileno',
    value: 'Mobile number',
    category: 'contact',
    verified: [],
    source: 'User-provided',
    description: 'Mobile telephone number of form-filler.',
    fieldType: BasicField.Mobile,
  },
  {
    name: 'homeno',
    value: 'Home number',
    category: 'contact',
    verified: [],
    source: 'User-provided',
    description: 'Home telephone number of form-filler.',
    fieldType: BasicField.HomeNo,
  },
  {
    name: 'gradyear',
    value: 'Year of graduation',
    category: 'employment_education',
    verified: [],
    source: 'User-provided',
    description:
      "Graduation year of form filler's last attended educational institution.",
    fieldType: BasicField.Number,
    ValidationOptions: {
      selectedValidation: 'Exact',
      customVal: 4,
      customMin: 4,
      customMax: 4,
    },
  },
]
