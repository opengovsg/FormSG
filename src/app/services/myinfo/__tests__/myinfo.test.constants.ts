import { ObjectId } from 'bson'
import { merge, zipWith } from 'lodash'

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
  mailadd: {
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
  homeno: {
    code: '65',
    prefix: '+',
    lastupdated: '2017-11-20',
    source: '2',
    classification: 'C',
    nbr: '66132665',
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
    country: 'SG',
    unit: '128',
    street: 'BEDOK NORTH AVENUE 1',
    lastupdated: '2016-03-11',
    block: '548',
    source: '1',
    postal: '460548',
    classification: 'C',
    floor: '09',
    building: '',
  },
  mailadd: {
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
  billadd: {
    country: 'SG',
    street: 'SERANGOON AVE 3',
    lastupdated: '2016-03-11',
    block: '329',
    source: '1',
    postal: '550329',
    classification: 'C',
    floor: '09',
    unit: '360',
    building: '',
  },
  workpassexpirydate: {
    lastupdated: '2018-03-02',
    source: '1',
    classification: 'C',
    value: '2018-12-31',
  },
}

export const MOCK_FORM_FIELDS = [
  // Some MyInfo fields
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'name' } },
  { fieldType: 'textfield', isVisible: false, myInfo: { attr: 'mobileno' } },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'homeno' } },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'mailadd' } },
  // Some non-MyInfo fields
  { fieldType: 'dropdown' },
  { fieldType: 'textfield' },
]

export const MOCK_HASHES = {
  name: 'name',
  mobileno: 'mobileno',
  mailadd: 'mailadd',
}

// Based on MOCK_FORM_FIELDS and MOCK_HASHES, only expect these attributes to
// be matched based on hashes. mobileno does not match because its isVisible is false,
// and homeno does not match because it does not have a hash.
export const MOCK_MATCHED_ATTRS = new Set(['name', 'mailadd'])

const populatedValues = [
  { fieldValue: 'TAN XIAO HUI', disabled: true },
  { fieldValue: '+65 97324992', disabled: false },
  { fieldValue: '', disabled: false },
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
