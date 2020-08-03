const { omit, cloneDeep } = require('lodash')
const mongoose = require('mongoose')
const { ObjectId } = require('bson-ext')

const dbHandler = require('../helpers/db-handler')

// TODO: Stop using spec
const SmsCount = spec('dist/backend/app/models/sms_count.server.model').default(
  mongoose,
)

const MOCK_SMSCOUNT_PARAMS = {
  form: new ObjectId(),
  formAdmin: {
    email: 'mockEmail@example.com',
    userId: new ObjectId(),
  },
}

const MOCK_MSG_SRVC_SID = 'mockMsgSrvcSid'

describe('SmsCount', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    it('should create and save successfully', async () => {
      // Arrange
      const smsCountParams = createSmsCountParams()

      // Act
      const validSmsCount = new SmsCount(smsCountParams)
      const saved = await validSmsCount.save()

      // Assert
      // All fields should exist
      // Object Id should be defined when successfully saved to MongoDB.
      expect(saved._id).toBeDefined()
      expect(saved.createdAt).toBeInstanceOf(Date)
      // Retrieve object and compare to params, remove indeterministic keys
      const actualSavedObject = omit(saved.toObject(), [
        '_id',
        'createdAt',
        '__v',
      ])
      expect(actualSavedObject).toEqual(smsCountParams)
    })

    it('should save successfully, but not save fields that is not defined in the schema', async () => {
      // Arrange
      const smsCountParamsWithExtra = createSmsCountParams()
      smsCountParamsWithExtra.extra = 'somethingExtra'

      // Act
      const validSmsCount = new SmsCount(smsCountParamsWithExtra)
      const saved = await validSmsCount.save()

      // Assert
      // All defined fields should exist
      // Object Id should be defined when successfully saved to MongoDB.
      expect(saved._id).toBeDefined()
      // Extra key should not be saved
      expect(saved.extra).toBeUndefined()
      expect(saved.createdAt).toBeInstanceOf(Date)
      // Retrieve object and compare to params, remove indeterministic keys
      const actualSavedObject = omit(saved.toObject(), [
        '_id',
        'createdAt',
        '__v',
      ])
      expect(actualSavedObject).toEqual(omit(smsCountParamsWithExtra, 'extra'))
    })

    it('should reject if form key is missing', async () => {
      // Arrange
      const malformedParams = omit(createSmsCountParams(), 'form')
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expectAsync(malformedSmsCount.save()).toBeRejectedWithError(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if formAdmin.email is missing', async () => {
      // Arrange
      const malformedParams = omit(createSmsCountParams(), 'formAdmin.email')
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expectAsync(malformedSmsCount.save()).toBeRejectedWithError(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if formAdmin.userId is missing', async () => {
      // Arrange
      const malformedParams = omit(createSmsCountParams(), 'formAdmin.userId')
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expectAsync(malformedSmsCount.save()).toBeRejectedWithError(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if logType is missing', async () => {
      // Arrange
      const malformedParams = omit(createSmsCountParams(), 'logType')
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expectAsync(malformedSmsCount.save()).toBeRejectedWithError(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if logType is invalid', async () => {
      // Arrange
      const malformedParams = createSmsCountParams()
      malformedParams.logType = 'INVALID_LOG_TYPE'
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expectAsync(malformedSmsCount.save()).toBeRejectedWithError(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if smsType is missing', async () => {
      // Arrange
      const malformedParams = omit(createSmsCountParams(), 'smsType')
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expectAsync(malformedSmsCount.save()).toBeRejectedWithError(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if smsType is invalid', async () => {
      // Arrange
      const malformedParams = createSmsCountParams()
      malformedParams.smsType = 'INVALID_SMS_TYPE'
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expectAsync(malformedSmsCount.save()).toBeRejectedWithError(
        mongoose.Error.ValidationError,
      )
    })
  })

  describe('Statics', () => {
    describe('logSms', () => {
      const MOCK_FORM_ID = MOCK_SMSCOUNT_PARAMS.form

      it('should successfully log verification successes in the collection', async () => {
        // Act
        const expectedLog = await logAndReturnExpectedLog({
          smsType: 'VERIFICATION',
          logType: 'SUCCESS',
        })

        // Assert
        const count = await SmsCount.countDocuments({})
        // Should have 1 document in the database since it is successful
        expect(count).toEqual(1)

        // Should contain OTP data and the correct sms/log type.
        const actualLog = await SmsCount.findOne({
          form: MOCK_FORM_ID,
        }).lean()

        expect(actualLog._id).toBeDefined()
        expect(actualLog.createdAt).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(actualLog, ['_id', 'createdAt', '__v'])
        expect(actualSavedObject).toEqual(expectedLog)
      })

      it('should successfully log verification failures in the collection', async () => {
        // Act
        const expectedLog = await logAndReturnExpectedLog({
          smsType: 'VERIFICATION',
          logType: 'FAILURE',
        })

        // Assert
        const count = await SmsCount.countDocuments({})
        // Should have 1 document in the database since it is successful
        expect(count).toEqual(1)

        // Should contain OTP data and the correct sms/log type.
        const actualLog = await SmsCount.findOne({
          form: MOCK_FORM_ID,
        }).lean()

        expect(actualLog._id).toBeDefined()
        expect(actualLog.createdAt).toBeInstanceOf(Date)
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(actualLog, ['_id', 'createdAt', '__v'])
        expect(actualSavedObject).toEqual(expectedLog)
      })

      it('should reject if smsType is invalid', async () => {
        await expectAsync(
          logAndReturnExpectedLog({
            smsType: 'INVALID',
            logType: 'FAILURE',
          }),
        ).toBeRejectedWithError(mongoose.Error.ValidationError)
      })

      it('should reject if logType is invalid', async () => {
        await expectAsync(
          logAndReturnExpectedLog({
            smsType: 'VERIFICATION',
            logType: 'INVALID',
          }),
        ).toBeRejectedWithError(mongoose.Error.ValidationError)
      })
    })
  })
})

const createSmsCountParams = ({
  logType = 'SUCCESS',
  smsType = 'VERIFICATION',
} = {}) => {
  const smsCountParams = cloneDeep(MOCK_SMSCOUNT_PARAMS)
  smsCountParams.logType = logType
  smsCountParams.smsType = smsType
  smsCountParams.msgSrvcSid = MOCK_MSG_SRVC_SID

  return smsCountParams
}

const logAndReturnExpectedLog = async ({ logType, smsType }) => {
  await SmsCount.logSms({
    otpData: MOCK_SMSCOUNT_PARAMS,
    msgSrvcSid: MOCK_MSG_SRVC_SID,
    smsType,
    logType,
  })

  const expectedLog = {
    ...MOCK_SMSCOUNT_PARAMS,
    msgSrvcSid: MOCK_MSG_SRVC_SID,
    smsType,
    logType,
  }

  return expectedLog
}
