import keyBy from 'lodash/keyBy'
import {
  BasicField,
  MyInfoAttribute,
  MyInfoChildVaxxStatus,
  MyInfoField,
  TranslationMapping,
} from '../../../types/field'
import { myInfoCountries } from './myinfo-countries'
import { myInfoDialects } from './myinfo-dialects'
import { myInfoNationalities } from './myinfo-nationalities'
import { myInfoOccupations } from './myinfo-occupations'
import { myInfoRaces } from './myinfo-races'
import { myInfoHousingTypes } from './myinfo-housing-types'
import { myInfoHdbTypes } from './myinfo-hdb-types'
import { Language } from '../../../types'

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
  titleTranslations?: TranslationMapping[]
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '姓名' },
      { language: Language.MALAY, translation: 'Nama' },
      { language: Language.TAMIL, translation: 'பெயர்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '性别' },
      { language: Language.MALAY, translation: 'Jantina' },
      { language: Language.TAMIL, translation: 'பாலினம்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '出生日期' },
      { language: Language.MALAY, translation: 'Tarikh lahir' },
      { language: Language.TAMIL, translation: 'பிறந்த தேதி' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '种族' },
      { language: Language.MALAY, translation: 'Kaum' },
      { language: Language.TAMIL, translation: 'இனம்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '国籍/公民身份' },
      { language: Language.MALAY, translation: 'Kerakyatan / Kewarganegaraan' },
      { language: Language.TAMIL, translation: 'குடியுரிமை' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '出生地' },
      { language: Language.MALAY, translation: 'Negara / Tempat Lahir' },
      { language: Language.TAMIL, translation: 'நாடு/ பிறந்த இடம்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '最新居留状态' },
      { language: Language.MALAY, translation: 'Status Kediaman Terkini' },
      { language: Language.TAMIL, translation: 'சமீபத்திய குடியிருப்பு நிலை' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '方言' },
      { language: Language.MALAY, translation: 'Dialek' },
      { language: Language.TAMIL, translation: 'பேச்சுவழக்கு' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '房型' },
      { language: Language.MALAY, translation: 'Jenis Perumahan' },
      { language: Language.TAMIL, translation: 'வீட்டு வகை' },
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
    fieldOptions: myInfoHdbTypes,
    previewValue: 'EXECUTIVE FLAT (HDB)',
    titleTranslations: [
      { language: Language.CHINESE, translation: '组屋类型' },
      { language: Language.MALAY, translation: 'Jenis HDB' },
      { language: Language.TAMIL, translation: 'வீடமைப்பு வளர்ச்சி கழகம் வகை' },
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
    previewValue: 'E1234567X',
    titleTranslations: [
      { language: Language.CHINESE, translation: '护照号码' },
      { language: Language.MALAY, translation: 'Nombor Pasport' },
      { language: Language.TAMIL, translation: 'கடவுச்சீட்டு எண்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '护照有效日期' },
      { language: Language.MALAY, translation: 'Tarikh Luput Pasport' },
      { language: Language.TAMIL, translation: 'கடவுச்சீட்டு காலாவதி தேதி' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '婚姻状况' },
      { language: Language.MALAY, translation: 'Status Perkahwinan' },
      { language: Language.TAMIL, translation: 'திருமண நிலை' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '婚姻注册地' },
      { language: Language.MALAY, translation: 'Negara / Tempat Perkahwinan' },
      { language: Language.TAMIL, translation: 'நாடு/ திருமண இடம்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '登记地址' },
      { language: Language.MALAY, translation: 'Alamat berdaftar' },
      { language: Language.TAMIL, translation: 'பதிவு செய்யப்பட்ட முகவரி' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '职业' },
      { language: Language.MALAY, translation: 'Pekerjaan' },
      { language: Language.TAMIL, translation: 'தொழில்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '雇主名字' },
      { language: Language.MALAY, translation: 'Nama Majikan' },
      { language: Language.TAMIL, translation: 'முதலாளியின் பெயர்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '车牌' },
      { language: Language.MALAY, translation: 'Nombor Kenderaan' },
      { language: Language.TAMIL, translation: 'வாகன எண்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '结婚证号码' },
      { language: Language.MALAY, translation: 'Nombor Sijil Perkahwinan' },
      { language: Language.TAMIL, translation: 'திருமண சான்றிதழ் எண்' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '结婚日期' },
      { language: Language.MALAY, translation: 'Tarikh Perkahwinan' },
      { language: Language.TAMIL, translation: 'திருமண தேதி' },
    ],
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '离婚日期' },
      { language: Language.MALAY, translation: 'Tarikh Penceraian' },
      { language: Language.TAMIL, translation: 'விவாகரத்து தேதி' },
    ],
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
    // TODO: Get title translations
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
    // TODO: Get title translations
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
    titleTranslations: [
      { language: Language.CHINESE, translation: '手机号码' },
      { language: Language.MALAY, translation: 'Nombor telefon bimbit' },
      { language: Language.TAMIL, translation: 'கைப்பேசி எண்' },
    ],
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
    // TODO: Get title translations
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
    // TODO: Get title translations
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
    // TODO: Get title translations
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
    // TODO: Get title translations
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
    // TODO: Get title translations
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
    previewValue: MyInfoChildVaxxStatus.ONEM3D_FULFILLED,
    // TODO: Get title translations
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
    // TODO: Get title translations
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
    // TODO: Get title translations
  },
]

export const MYINFO_ATTRIBUTE_MAP = keyBy(types, 'name')
