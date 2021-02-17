import { AddressType, MyInfoSource } from '@opengovsg/myinfo-gov-client'
import { ObjectId } from 'bson'
import { merge, zipWith } from 'lodash'

import { Environment } from 'src/types'

export const MOCK_MYINFO_DATA = {
  name: {
    lastupdated: '2015-06-01',
    source: '1',
    classification: 'C',
    value: 'TAN XIAO HUI',
  },
  mobileno: {
    code: '65',
    prefix: '+',
    lastupdated: '2017-12-13',
    source: '4',
    classification: 'C',
    nbr: '97324992',
  },
  regadd: {
    country: 'US',
    unit: '',
    street: '5TH AVENUE',
    lastupdated: '2016-03-11',
    block: '725',
    source: '2',
    postal: 'NY 10022',
    classification: 'C',
    floor: '',
    building: 'TRUMP TOWER',
  },
  employment: {
    lastupdated: '2017-10-11',
    source: '2',
    classification: 'C',
    value: 'ALPHA',
  },
}

export const MOCK_MYINFO_FORMAT_DATA = {
  mobileno: {
    areacode: { value: '65' },
    prefix: { value: '+' },
    lastupdated: '2017-12-13',
    source: MyInfoSource.GovtVerified,
    classification: 'C',
    nbr: { value: '97324992' },
  },
  regadd: {
    type: AddressType.Singapore,
    country: { code: 'SG', desc: 'SINGAPORE' },
    unit: { value: '128' },
    street: { value: 'BEDOK NORTH AVENUE 1' },
    lastupdated: '2016-03-11',
    block: { value: '548' },
    source: MyInfoSource.GovtVerified,
    postal: { value: '460548' },
    classification: 'C',
    floor: { value: '09' },
    building: { value: '' },
  },
  passexpirydate: {
    lastupdated: '2018-03-02',
    source: MyInfoSource.GovtVerified,
    classification: 'C',
    value: '2018-12-31',
  },
}

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
  { fieldValue: '+65 97324992', disabled: false },
  {
    fieldValue: 'TRUMP TOWER, 725 5TH AVENUE, UNITED STATES NY 10022',
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
export const MOCK_KEY_PATH =
  './node_modules/@opengovsg/mockpass/static/certs/key.pem'
export const MOCK_REALM = 'mockRealm'
export const MOCK_ESRVC_ID = 'mockEsrvcId'
export const MOCK_UINFIN = 'uinFin'
export const MOCK_FETCH_PARAMS = {
  uinFin: MOCK_UINFIN,
  requestedAttributes: ['mockAttr'],
  singpassEserviceId: 'mockEsrvcId',
}
export const MOCK_FORM_ID = new ObjectId().toHexString()
export const MOCK_NODE_ENV = Environment.Test
export const MOCK_APP_TITLE = 'appTitle'
