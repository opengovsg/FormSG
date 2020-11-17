const _ = require('lodash')
const crypto = require('crypto')
const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')
const MyInfoService = require('../../../../dist/backend/app/services/myinfo.service')

const NON_MYINFO_FIELDS = [
  { fieldType: 'dropdown' },
  { fieldType: 'textfield' },
  { fieldType: 'number' },
]

const DROPDOWN_FIELDS = [
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'sex' } },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'race' } },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'dialect' } },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'nationality' } },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'birthcountry' } },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'residentialstatus' },
  },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'housingtype' } },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'hdbtype' } },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'edulevel' } },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'schoolname' } },
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'occupation' } },
]

const DROPDOWN_RESPONSE = {
  sex: {
    lastupdated: '2016-03-11',
    source: '1',
    classification: 'C',
    value: 'F',
  },
  race: {
    lastupdated: '2016-03-11',
    source: '1',
    classification: 'C',
    value: 'CN',
  },
  dialect: {
    lastupdated: '2016-03-11',
    source: '1',
    classification: 'C',
    value: 'SG',
  },
  nationality: {
    lastupdated: '2016-03-11',
    source: '1',
    classification: 'C',
    value: 'SG',
  },
  birthcountry: {
    lastupdated: '2016-03-11',
    source: '1',
    classification: 'C',
    value: 'SG',
  },
  residentialstatus: {
    lastupdated: '2017-08-25',
    source: '1',
    classification: 'C',
    value: 'C',
  },
  housingtype: {
    lastupdated: null,
    source: '1',
    classification: 'C',
    value: '121',
  },
  hdbtype: {
    lastupdated: '2015-12-23',
    source: '1',
    classification: 'C',
    value: '111',
  },
  edulevel: {
    lastupdated: '2017-10-11',
    source: '2',
    classification: 'C',
    value: '3',
  },
  schoolname: {
    lastupdated: '2017-10-11',
    source: '2',
    classification: 'C',
    value: 'T07GS3011J',
    desc: 'SIGLAP SECONDARY SCHOOL',
  },
  occupation: {
    lastupdated: '2017-10-11',
    source: '2',
    classification: 'C',
    value: '53201',
    desc: 'HEALTHCARE ASSISTANT',
  },
}

const NUMBER_FIELDS = [{ fieldType: 'number', myInfo: { attr: 'gradyear' } }]

const NUMBER_RESPONSE = {
  gradyear: {
    lastupdated: '2017-10-11',
    source: '2',
    classification: 'C',
    value: '1978',
  },
}

const TEXT_FIELDS = [
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'name' } },
  {
    fieldType: 'textfield',
    isVisible: true,
    myInfo: { attr: 'passportnumber' },
  },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'vehno' } },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'employment' } },
]

const TEXT_RESPONSE = {
  name: {
    lastupdated: '2015-06-01',
    source: '1',
    classification: 'C',
    value: 'TAN XIAO HUI',
  },
  passportnumber: {
    lastupdated: '2017-08-25',
    source: '1',
    classification: 'C',
    value: 'E35463874W',
  },
  vehno: {
    lastupdated: '',
    source: '2',
    classification: 'C',
    value: 'SGX1234Z',
  },
  employment: {
    lastupdated: '2017-10-11',
    source: '2',
    classification: 'C',
    value: 'ALPHA',
  },
}

const TEXT_PHONE_FIELDS = [
  { fieldType: 'mobile', isVisible: true, myInfo: { attr: 'mobileno' } },
  { fieldType: 'homeno', isVisible: true, myInfo: { attr: 'homeno' } },
]

const TEXT_PHONE_RESPONSE = {
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
}

const DATE_FIELDS = [
  { fieldType: 'date', isVisible: true, myInfo: { attr: 'dob' } },
  { fieldType: 'date', isVisible: true, myInfo: { attr: 'marriagedate' } },
  { fieldType: 'date', isVisible: true, myInfo: { attr: 'divorcedate' } },
  {
    fieldType: 'date',
    isVisible: true,
    myInfo: { attr: 'passportexpirydate' },
  },
]

const DATE_RESPONSE = {
  dob: {
    lastupdated: '2016-03-11',
    source: '1',
    classification: 'C',
    value: '1958-05-17',
  },
  marriagedate: {
    lastupdated: '',
    source: '1',
    classification: 'C',
    value: '2018-10-12',
  },
  divorcedate: {
    lastupdated: '',
    source: '1',
    classification: 'C',
    value: '2018-10-13',
  },
  passportexpirydate: {
    lastupdated: '2017-08-25',
    source: '1',
    classification: 'C',
    value: '2020-01-01',
  },
}

const ADDRESS_FIELDS = [
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'regadd' } },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'mailadd' } },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'billadd' } },
]

const ADDRESS_RESPONSE = {
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
    unit: '',
    street: '',
    lastupdated: '',
    block: '',
    source: '',
    postal: '',
    classification: '',
    floor: '',
    building: '',
  },
}

const WORKPASS_FIELDS = [
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'workpassstatus' },
  },
  {
    fieldType: 'date',
    isVisible: true,
    myInfo: { attr: 'workpassexpirydate' },
  },
]

const WORKPASS_RESPONSE = {
  workpassstatus: {
    lastupdated: '2018-03-02',
    source: '1',
    classification: 'C',
    value: 'Live',
  },
  workpassexpirydate: {
    lastupdated: '2018-03-02',
    source: '1',
    classification: 'C',
    value: '2018-12-31',
  },
}

const MARRIAGE_FIELDS = [
  { fieldType: 'dropdown', isVisible: true, myInfo: { attr: 'marital' } },
  { fieldType: 'date', isVisible: true, myInfo: { attr: 'marriagedate' } },
  { fieldType: 'date', isVisible: true, myInfo: { attr: 'divorcedate' } },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'countryofmarriage' },
  },
  {
    fieldType: 'textfield',
    isVisible: true,
    myInfo: { attr: 'marriagecertno' },
  },
]

const MARRIAGE_RESPONSE = {
  marital: {
    lastupdated: '2017-03-29',
    source: '1',
    classification: 'C',
    value: '1',
  },
  marriagecertno: {
    lastupdated: '2018-03-02',
    source: '1',
    classification: 'C',
    value: '123456789012345',
  },
  countryofmarriage: {
    lastupdated: '2018-03-02',
    source: '1',
    classification: 'C',
    value: 'SG',
  },
  marriagedate: {
    lastupdated: '',
    source: '1',
    classification: 'C',
    value: '2018-10-12',
  },
  divorcedate: {
    lastupdated: '',
    source: '1',
    classification: 'C',
    value: '2018-10-13',
  },
}

const ALL_MYINFO_FIELDS = [].concat(
  DROPDOWN_FIELDS,
  NUMBER_FIELDS,
  TEXT_FIELDS,
  TEXT_PHONE_FIELDS,
  DATE_FIELDS,
  ADDRESS_FIELDS,
  WORKPASS_FIELDS,
  MARRIAGE_FIELDS,
)

const ALL_MYINFO_RESPONSES = Object.assign(
  {},
  DROPDOWN_RESPONSE,
  NUMBER_RESPONSE,
  TEXT_RESPONSE,
  TEXT_PHONE_RESPONSE,
  DATE_RESPONSE,
  ADDRESS_RESPONSE,
  WORKPASS_RESPONSE,
  MARRIAGE_RESPONSE,
)

// This should match MyInfo server responses specified above.
// The fieldvalues hash into MyInfo hash values below
const ALL_MYINFO_CLIENT_SUBMISSION = [
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'sex' },
    fieldValue: 'FEMALE',
    disabled: true,
  },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'race' },
    fieldValue: 'CHINESE',
    disabled: true,
  },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'dialect' },
    fieldValue: 'SWISS GERMAN',
    disabled: true,
  },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'nationality' },
    fieldValue: 'SINGAPORE CITIZEN',
    disabled: true,
  },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'birthcountry' },
    fieldValue: 'SINGAPORE',
    disabled: true,
  },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'residentialstatus' },
    fieldValue: 'Citizen',
    disabled: true,
  },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'hdbtype' },
    fieldValue: '1-ROOM FLAT (HDB)',
    disabled: true,
  },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'housingtype' },
    fieldValue: 'DETACHED HOUSE',
    disabled: true,
  },
  {
    fieldType: 'textfield',
    isVisible: true,
    myInfo: { attr: 'name' },
    fieldValue: 'TAN XIAO HUI',
    disabled: true,
  },
  {
    fieldType: 'textfield',
    isVisible: true,
    myInfo: { attr: 'passportnumber' },
    fieldValue: 'E35463874W',
    disabled: true,
  },
  {
    fieldType: 'date',
    isVisible: true,
    myInfo: { attr: 'dob' },
    fieldValue: '1958-05-17',
    disabled: true,
  },
  {
    fieldType: 'date',
    isVisible: true,
    myInfo: { attr: 'passportexpirydate' },
    fieldValue: '2020-01-01',
    disabled: true,
  },
  {
    fieldType: 'textfield',
    isVisible: true,
    myInfo: { attr: 'regadd' },
    fieldValue: '548 BEDOK NORTH AVENUE 1, #09-128, SINGAPORE 460548',
    disabled: true,
  },
  {
    fieldType: 'dropdown',
    isVisible: true,
    myInfo: { attr: 'workpassstatus' },
    fieldValue: 'Live',
    disabled: true,
  },
  {
    fieldType: 'date',
    isVisible: true,
    myInfo: { attr: 'workpassexpirydate' },
    fieldValue: '2018-12-31',
    disabled: true,
  },
].map((field) => ({
  isVisible: field.isVisible,
  myInfo: field.myInfo,
  answer: field.fieldValue,
  question: '',
}))

// Hashes corresponding to client submissions
const ALL_MYINFO_HASHES = {
  sex: '$2b$10$6eLrXVVVotjkADx9Hb6kf.71SMvU4nfb/TQ10f2CiDXU1pqanLNJ2',
  race: '$2b$10$c3kZKKbv99PI7HnYRyVa9uVidXM2JwrAhWpdBPSXywXBO2Dlnnkpu',
  dialect: '$2b$10$/1D/TaGE3Hr6/6FNS7moQ.cfg9rzNQSbaYTawZFBAbSTzRa5DYTGi',
  nationality: '$2b$10$8MJbGm/9U96ardmVFL30nOQFBb3Wn6wouTShVB09mLAzrHR0qGdl.',
  birthcountry: '$2b$10$oGccIQFQDukH95ntZjD5v.NljXwyM2YajZ/IkAHVkIcq1VgTbjvtK',
  residentialstatus:
    '$2b$10$YnLlcpvhl4Oxc7zePQtCwejXqcU.HX9eqIG7n.IL0AjEkjDReqcHy',
  hdbtype: '$2b$10$gZ9sajzwz.PIjdufQW2uTO0PU8xJOea681BJ/J7SzDnrnXm0bQJii',
  housingtype: '$2b$10$BCPSbyEzkhwysvug5QOW8utSIQAMByOD4nIqOgJg97lMFWRuHWp8a',
  name: '$2b$10$ZE6GeiDJUsdaKjBugg8b1.YL/j7MtTKgC1qZTWQ4TM2m.PtZEM1GC',
  passportnumber:
    '$2b$10$DKE5K6AwIpuyLf4yjyJg4O5lqc8EsknkIKc2DlJUaAQUn0o8L0gqu',
  dob: '$2b$10$rq7bD4vwmLV3P2xx7my9lOfIBDQQA81GYLVixyShidjdCI08Q5hHi',
  passportexpirydate:
    '$2b$10$IuliSYajxKD85ijhYre3Teg92ie55XMPH1Y84dfKxIFxGegjksZjO',
  regadd: '$2b$10$2Pdf/JGxxRkqPO9EHN6vOOptlvK35rHxr6RK16qagsNsVvD/CHNwS',
  workpassstatus:
    '$2b$10$ZBl.zDKp0.dPIPzYiUkYB.rmP1GNsoJSm7FtzfJgRJfZbtfuCpEUe',
  workpassexpirydate:
    '$2b$10$eLakOm88NEuUawlGHsiPjeaImpYT5ZBH1JyZUseIRL9kCtDRIKdCe',
}

const SESSION_SECRET = process.env.SESSION_SECRET

const User = dbHandler.makeModel('user.server.model', 'User')
const Agency = dbHandler.makeModel('agency.server.model', 'Agency')
const Form = dbHandler.makeModel('form.server.model', 'Form')
const MyInfoHash = dbHandler.makeModel('myinfo_hash.server.model', 'MyInfoHash')

const Controller = spec(
  'dist/backend/app/controllers/myinfo.server.controller',
  {
    mongoose: Object.assign(mongoose, { '@noCallThru': true }),
  },
)

describe('MyInfo Controller', () => {
  // Declare global variables
  let res

  const MyInfoGovClient = jasmine.createSpyObj('MyInfoGovClient', [
    'getPersonBasic',
  ])
  const spCookieMaxAge = 200 * 1000

  const myInfoService = new MyInfoService(MyInfoGovClient, spCookieMaxAge)

  /**
   * Returns a SingPass request object
   * @return {Object}
   */
  function getNewBaseRequest() {
    return {
      query: {},
      params: {},
      body: {},
      session: {
        user: {
          _id: mongoose.Types.ObjectId('000000000001'),
          email: 'test@test.gov.sg',
        },
      },
      form: {
        authType: 'SP',
        form_fields: [],
        toJSON: function () {
          return this
        },
      },
      headers: {},
      ip: '127.0.0.1',
      get: () => '',
    }
  }

  /**
   * Returns a preconfigured response object
   * @return {Object}
   */
  function getNewBaseResponse() {
    let res = jasmine.createSpyObj('res', ['status', 'send', 'json'])

    res.status.and.returnValue(res)
    res.send.and.returnValue(res)
    res.json.and.returnValue(res)

    res.locals = {
      spcpSession: {
        userName: 'S8979373D',
      },
    }
    return res
  }

  beforeEach(() => {
    res = getNewBaseResponse()
  })
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    // Required to prevent request failures to cascade to other tests.
    myInfoService.myInfoClientBreaker.close()
    myInfoService.myInfoClientBreaker.clearCache()
    await dbHandler.clearDatabase()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('verifyMyInfoVals', () => {
    describe('Passthrough for non-MyInfo forms', () => {
      let req
      let next

      beforeEach((done) => {
        req = getNewBaseRequest()
        req.form.form_fields = _.cloneDeep(NON_MYINFO_FIELDS)
        next = jasmine.createSpy()
        done()
      })

      const expectPassthrough = (req, res) => {
        next = jasmine.createSpy().and.callFake(() => {
          expect(req.form.form_fields).toEqual(_.cloneDeep(NON_MYINFO_FIELDS))
          expect(res.send).not.toHaveBeenCalled()
          expect(res.status).not.toHaveBeenCalled()
          expect(res.json).not.toHaveBeenCalled()
        })
        Controller.verifyMyInfoVals(req, res, next)
      }

      it('works for non-SingPass forms', () => {
        req.form.authType = ''
        expectPassthrough(req, res)
      })

      it('works for CorpPass forms', () => {
        req.form.authType = 'CP'
        expectPassthrough(req, res)
      })

      it('works for SingPass forms with no MyInfo attributes', () => {
        req.form.authType = 'SP'
        expectPassthrough(req, res)
      })
    })

    describe('Hash verification', () => {
      let req
      let res
      let next

      it('should pass all hashed fields to the next controller on success', (done) => {
        req = getNewBaseRequest()
        req.form.form_fields = ALL_MYINFO_FIELDS // Actual form fields
        req.body.parsedResponses = ALL_MYINFO_CLIENT_SUBMISSION // Client submission

        res = getNewBaseResponse()

        let testAgency, testUser, testForm, testHash

        testAgency = new Agency({
          shortName: 'govtest',
          fullName: 'Government Testing Agency',
          emailDomain: 'test.gov.sg',
          logo: '/invalid-path/test.jpg',
        })

        testAgency
          .save()
          .then(() => {
            testUser = new User({
              _id: req.session.user._id,
              email: req.session.user.email,
              agency: testAgency._id,
            })
            return testUser.save()
          })
          .then(() => {
            testForm = new Form({
              title: 'Test MyInfo Form',
              emails: req.session.user.email,
              admin: req.session.user._id,
              form_fields: ALL_MYINFO_FIELDS,
              authType: 'SP',
            })
            return testForm.save()
          })
          .then(() => {
            const hashedUinFin = crypto
              .createHmac('sha256', SESSION_SECRET)
              .update(res.locals.spcpSession.userName)
              .digest('hex')
            testHash = new MyInfoHash({
              uinFin: hashedUinFin,
              form: testForm._id,
              fields: _.cloneDeep(ALL_MYINFO_HASHES),
              expireAt: Date.now() + spCookieMaxAge,
            })
            return testHash.save()
          })
          .then(() => {
            req.form._id = testForm._id
            res.locals.uinFin = res.locals.spcpSession.userName

            next = jasmine.createSpy().and.callFake(() => {
              expect(
                _.isEqual(
                  new Set(_.keys(req.hashedFields)),
                  new Set(_.keys(ALL_MYINFO_HASHES)),
                ),
              ).toBeTruthy()
              expect(res.send).not.toHaveBeenCalled()
              expect(res.json).not.toHaveBeenCalled()
              done()
            })
            Controller.verifyMyInfoVals(req, res, next)
          })
      })
    })
  }) // end verifyMyInfoVals

  describe('addMyInfo', () => {
    describe('Passthrough for non-MyInfo forms', () => {
      let req
      let next

      beforeEach((done) => {
        req = getNewBaseRequest()
        req.form.form_fields = _.cloneDeep(NON_MYINFO_FIELDS)
        next = jasmine.createSpy()
        done()
      })

      const expectPassthrough = (req, res) => {
        next = jasmine.createSpy().and.callFake(() => {
          expect(req.form.form_fields).toEqual(_.cloneDeep(NON_MYINFO_FIELDS))
          expect(res.send).not.toHaveBeenCalled()
          expect(res.status).not.toHaveBeenCalled()
          expect(res.json).not.toHaveBeenCalled()
        })
        Controller.addMyInfo(myInfoService)(req, res, next)
      }

      it('works for non-SingPass forms', () => {
        req.form.authType = ''
        expectPassthrough(req, res)
      })

      it('works for CorpPass forms', () => {
        req.form.authType = 'CP'
        expectPassthrough(req, res)
      })

      it('works for SingPass forms with no MyInfo attributes', () => {
        req.form.authType = 'SP'
        expectPassthrough(req, res)
      })
    })

    describe('Editable (read-only) logic', () => {
      let req
      let next
      let nonMarriageFields
      let nonMarriageResponse

      beforeAll((done) => {
        nonMarriageFields = _.cloneDeep(
          _.differenceWith(ALL_MYINFO_FIELDS, MARRIAGE_FIELDS, _.isEqual),
        )

        nonMarriageResponse = _.cloneDeep(
          _.omit(ALL_MYINFO_RESPONSES, _.keys(MARRIAGE_RESPONSE)),
        )

        done()
      })

      it("should be disabled when 'source' flag is gov-verified and fieldValue exists for non-marriage fields", (done) => {
        req = getNewBaseRequest()
        req.form.form_fields = nonMarriageFields

        MyInfoGovClient.getPersonBasic.and.callFake(() => {
          return Promise.resolve(nonMarriageResponse)
        })

        next = jasmine.createSpy().and.callFake(() => {
          req.form.form_fields.forEach((field) => {
            let myInfoAttr = field.myInfo.attr
            let myInfoValue = field.fieldValue
            let myInfoField = nonMarriageResponse[myInfoAttr]
            let shouldBeDisabled =
              myInfoField.source === '1' && Boolean(myInfoValue)
            expect(field.disabled).toEqual(shouldBeDisabled)
          })
          done()
        })
        Controller.addMyInfo(myInfoService)(req, res, next)
      })

      it('should always be editable for marriage fields', () => {
        req = getNewBaseRequest()
        req.form.form_fields = _.cloneDeep(MARRIAGE_FIELDS)

        MyInfoGovClient.getPersonBasic.and.callFake(() => {
          return Promise.resolve(_.cloneDeep(MARRIAGE_RESPONSE))
        })

        next = jasmine.createSpy().and.callFake(() => {
          expect(
            req.form.form_fields.some((field) => field.disabled),
          ).not.toBeTruthy()
        })
        Controller.addMyInfo(myInfoService)(req, res, next)
      })
    })

    describe('Field values prepopulation', () => {
      /**
       * Checks that each myInfo field value is of the correct type
       * @param  {Object} formFields Form fields with MyInfo prefilled
       * @param  {String} myInfoAttr The MyInfo attribute to test
       * @param  {String} value  The expected field value
       */
      function valueCheck(formFields, myInfoAttr, value) {
        let [formField] = formFields.filter(
          (field) => field.myInfo.attr === myInfoAttr,
        )

        if (!formField) {
          throw Error(myInfoAttr + ' not found in formFields')
        }

        expect(formField.fieldValue).toEqual(value)
      }

      describe('Text fields', () => {
        let req
        let next

        beforeAll(() => {
          MyInfoGovClient.getPersonBasic.and.callFake(() => {
            return Promise.resolve(_.cloneDeep(TEXT_RESPONSE))
          })
        })

        beforeEach((done) => {
          req = getNewBaseRequest()
          req.form.form_fields = _.cloneDeep(TEXT_FIELDS)
          done()
        })

        it('should return correct string representation of name/passportnumber/vehno', (done) => {
          next = jasmine.createSpy().and.callFake(() => {
            valueCheck(req.form.form_fields, 'name', 'TAN XIAO HUI')
            valueCheck(req.form.form_fields, 'passportnumber', 'E35463874W')
            valueCheck(req.form.form_fields, 'vehno', 'SGX1234Z')
            done()
          })
          Controller.addMyInfo(myInfoService)(req, res, next)
        })
      })

      describe('Phone fields', () => {
        let req
        let next

        beforeAll(() => {
          MyInfoGovClient.getPersonBasic.and.callFake(() => {
            return Promise.resolve(_.cloneDeep(TEXT_PHONE_RESPONSE))
          })
        })

        beforeEach((done) => {
          req = getNewBaseRequest()
          req.form.form_fields = _.cloneDeep(TEXT_PHONE_FIELDS)
          done()
        })

        it('should return correct string representation of a phone number', (done) => {
          next = jasmine.createSpy().and.callFake(() => {
            valueCheck(req.form.form_fields, 'mobileno', '+65 97324992')
            valueCheck(req.form.form_fields, 'homeno', '+65 66132665')
            done()
          })
          Controller.addMyInfo(myInfoService)(req, res, next)
        })
      })

      describe('Date fields', () => {
        let req
        let next

        beforeAll(() => {
          MyInfoGovClient.getPersonBasic.and.callFake(() => {
            return Promise.resolve(_.cloneDeep(DATE_RESPONSE))
          })
        })

        beforeEach((done) => {
          req = getNewBaseRequest()
          req.form.form_fields = _.cloneDeep(DATE_FIELDS)
          done()
        })

        it('should return correct string representation of a date', (done) => {
          next = jasmine.createSpy().and.callFake(() => {
            valueCheck(req.form.form_fields, 'dob', '1958-05-17')
            valueCheck(req.form.form_fields, 'marriagedate', '2018-10-12')
            valueCheck(req.form.form_fields, 'divorcedate', '2018-10-13')
            valueCheck(req.form.form_fields, 'passportexpirydate', '2020-01-01')
            done()
          })
          Controller.addMyInfo(myInfoService)(req, res, next)
        })
      })

      describe('Address fields', () => {
        let req
        let next

        beforeAll(() => {
          MyInfoGovClient.getPersonBasic.and.callFake(() => {
            return Promise.resolve(_.cloneDeep(ADDRESS_RESPONSE))
          })
        })

        beforeEach((done) => {
          req = getNewBaseRequest()
          req.form.form_fields = _.cloneDeep(ADDRESS_FIELDS)
          done()
        })

        it('should return correct string representation of an address', (done) => {
          next = jasmine.createSpy().and.callFake(() => {
            valueCheck(
              req.form.form_fields,
              'regadd',
              '548 BEDOK NORTH AVENUE 1, #09-128, SINGAPORE 460548',
            )
            valueCheck(
              req.form.form_fields,
              'mailadd',
              'TRUMP TOWER, 725 5TH AVENUE, UNITED STATES NY 10022',
            )
            valueCheck(req.form.form_fields, 'billadd', '')
            done()
          })
          Controller.addMyInfo(myInfoService)(req, res, next)
        })
      })

      describe('Number fields', () => {
        let req
        let next

        beforeAll(() => {
          MyInfoGovClient.getPersonBasic.and.callFake(() => {
            return Promise.resolve(_.cloneDeep(NUMBER_RESPONSE))
          })
        })

        beforeEach((done) => {
          req = getNewBaseRequest()
          req.form.form_fields = _.cloneDeep(NUMBER_FIELDS)
          done()
        })

        it('should return correct number', (done) => {
          next = jasmine.createSpy().and.callFake(() => {
            valueCheck(req.form.form_fields, 'gradyear', '1978')
            done()
          })
          Controller.addMyInfo(myInfoService)(req, res, next)
        })
      })

      describe('Workpass fields', () => {
        describe('Singaporean and PRs', () => {
          let req
          let next

          beforeEach(() => {
            req = getNewBaseRequest()
            req.form.form_fields = WORKPASS_FIELDS
            MyInfoGovClient.getPersonBasic.and.callFake(() => {
              return Promise.resolve({})
            })
          })

          it('should be able to handle empty object response', (done) => {
            next = jasmine.createSpy().and.callFake(() => {
              valueCheck(req.form.form_fields, 'workpassstatus', '')
              valueCheck(req.form.form_fields, 'workpassexpirydate', '')
              done()
            })
            Controller.addMyInfo(myInfoService)(req, res, next)
          })
        })

        describe('Foreigners', () => {
          let req
          let next

          beforeEach(() => {
            req = getNewBaseRequest()
            req.form.form_fields = WORKPASS_FIELDS
            MyInfoGovClient.getPersonBasic.and.callFake(() => {
              return Promise.resolve(WORKPASS_RESPONSE)
            })
          })

          it('should return correct info', (done) => {
            next = jasmine.createSpy().and.callFake(() => {
              valueCheck(req.form.form_fields, 'workpassstatus', 'Live')
              valueCheck(
                req.form.form_fields,
                'workpassexpirydate',
                '2018-12-31',
              )
              done()
            })
            Controller.addMyInfo(myInfoService)(req, res, next)
          })
        })
      })
    })

    describe('MyInfo server is down', () => {
      let req
      let next

      beforeAll(() => {
        MyInfoGovClient.getPersonBasic.and.callFake(() => {
          return Promise.reject(new Error('Mock MyInfo server failure'))
        })
      })

      beforeEach((done) => {
        req = getNewBaseRequest()
        req.form.form_fields = _.cloneDeep(ALL_MYINFO_FIELDS)
        done()
      })

      it('should set myInfoError flag', (done) => {
        next = jasmine.createSpy().and.callFake(() => {
          expect(res.locals.myInfoError).toBeTruthy()
          done()
        })
        Controller.addMyInfo(myInfoService)(req, res, next)
      })
    })

    describe('MyInfo hashes', () => {
      let req
      let next

      beforeEach(() => {
        req = getNewBaseRequest()
        req.form.form_fields = ALL_MYINFO_FIELDS
        MyInfoGovClient.getPersonBasic.and.callFake(() => {
          return Promise.resolve(ALL_MYINFO_RESPONSES)
        })
      })

      it('should hash read-only fields to the database correctly', (done) => {
        next = jasmine.createSpy().and.callFake(() => {
          let readOnlyAttrs = new Set(
            req.form.form_fields
              .filter(
                (field) => field.disabled && field.myInfo && field.myInfo.attr,
              )
              .map((field) => field.myInfo.attr),
          )

          MyInfoHash.find({}, (error, hashes) => {
            expect(error).not.toBeTruthy()
            // DB should be reset before running this test
            expect(hashes.length).toEqual(1)

            let [hash] = hashes
            let hashAttrs = new Set(Object.keys(hash.fields))

            // Set of disabled fields should equal set of hashed fields
            expect(_.isEqual(readOnlyAttrs, hashAttrs)).toBeTruthy()

            // Expiry time should be set
            expect(hash.expireAt).toBeTruthy()

            // Hash value
            for (const myInfoAttr in hash.fields) {
              if (
                Object.prototype.hasOwnProperty.call(hash.fields, myInfoAttr)
              ) {
                // Test a value has been hashed into DB
                let hashValue = hash.fields[myInfoAttr]
                expect(hashValue).toBeTruthy()
              }
            }
          })
          done()
        })
        Controller.addMyInfo(myInfoService)(req, res, next)
      })
    })
  }) // end addMyInfo
}) // end myinfo server controller
