import { ObjectId } from 'bson'
import { merge, zipWith } from 'lodash'

import { ISpcpMyInfo } from 'src/app/config/features/spcp-myinfo.config'

import {
  IPerson,
  MyInfoAddressType,
  MyInfoSource,
} from '../myinfo.person.types'
import { IMyInfoServiceConfig, MyInfoLoginCookiePayload } from '../myinfo.types'

export const MOCK_MYINFO_DATA = {
  name: {
    lastupdated: '2015-06-01',
    source: '1',
    classification: 'C',
    value: 'TAN XIAO HUI',
  },
  mobileno: {
    areacode: { value: '65' },
    prefix: { value: '+' },
    lastupdated: '2017-12-13',
    source: MyInfoSource.UserProvided,
    classification: 'C',
    nbr: { value: '97324992' },
  },
  regadd: {
    type: MyInfoAddressType.Singapore,
    country: { code: 'SG', desc: 'SINGAPORE' },
    unit: { value: '128' },
    street: { value: 'BEDOK NORTH AVENUE 1' },
    lastupdated: '2016-03-11',
    block: { value: '548' },
    source: MyInfoSource.UserProvided,
    postal: { value: '460548' },
    classification: 'C',
    floor: { value: '09' },
    building: { value: '' },
  },
  employment: {
    lastupdated: '2017-10-11',
    source: '2',
    classification: 'C',
    value: 'ALPHA',
  },
} as IPerson

export const MOCK_FORM_FIELDS = [
  // Some MyInfo fields
  {
    fieldType: 'textfield',
    isVisible: true,
    myInfo: { attr: 'name' },
    _id: new ObjectId().toHexString(),
  },
  {
    fieldType: 'textfield',
    isVisible: false,
    myInfo: { attr: 'mobileno' },
    _id: new ObjectId().toHexString(),
  },
  {
    fieldType: 'textfield',
    isVisible: true,
    myInfo: { attr: 'regadd' },
    _id: new ObjectId().toHexString(),
  },
  // Some non-MyInfo fields
  { fieldType: 'dropdown', _id: new ObjectId().toHexString() },
  { fieldType: 'textfield', _id: new ObjectId().toHexString() },
]

export const MOCK_HASHES = {
  name: 'name',
  mobileno: 'mobileno',
  regadd: 'regadd',
}

// Based on MOCK_FORM_FIELDS and MOCK_HASHES, only expect these attributes to
// be matched based on hashes. mobileno does not match because its isVisible is false,
// and homeno does not match because it does not have a hash.
export const MOCK_HASHED_FIELD_IDS = new Set(
  MOCK_FORM_FIELDS.filter(
    (field) => field.myInfo && ['name', 'regadd'].includes(field.myInfo?.attr),
  ).map((field) => field._id),
)

const populatedValues = [
  { fieldValue: 'TAN XIAO HUI', disabled: true },
  { fieldValue: '+6597324992', disabled: false },
  {
    fieldValue: '548 BEDOK NORTH AVENUE 1, #09-128, SINGAPORE 460548',
    disabled: false,
  },
  {},
  {},
]

export const MOCK_POPULATED_FORM_FIELDS = zipWith(
  MOCK_FORM_FIELDS,
  populatedValues,
  (v1, v2) => merge(v1, v2),
)

export const MOCK_RESPONSES = zipWith(
  MOCK_FORM_FIELDS,
  populatedValues,
  (v1, v2) => merge(v1, v2, { answer: v2.fieldValue, fieldValue: undefined }),
)

export const MOCK_COOKIE_AGE = 2000
export const MOCK_UINFIN = 'S1234567A'
export const MOCK_FORM_ID = new ObjectId().toHexString()
export const MOCK_ACCESS_TOKEN = 'mockAccessToken'
export const MOCK_MYINFO_JWT_SECRET = 'mockMyInfoJwtSecret'
export const MOCK_MYINFO_JWT = 'mockMyInfoJwt'

export const MOCK_SERVICE_PARAMS: IMyInfoServiceConfig = {
  spcpMyInfoConfig: {
    spCookieMaxAge: MOCK_COOKIE_AGE,
  } as ISpcpMyInfo,
}

export const MOCK_MYINFO_LOGIN_COOKIE: MyInfoLoginCookiePayload = {
  uinFin: MOCK_UINFIN,
}
