/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson'
import { cloneDeep, merge, omit } from 'lodash'
import mongoose from 'mongoose'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { smsConfig } from '../../../config/features/sms.config'
import {
  IVerificationSmsCount,
  IVerificationSmsCountSchema,
  LogType,
  SmsType,
} from '../sms.types'
import getSmsCountModel from '../sms_count.server.model'

const SmsCount = getSmsCountModel(mongoose)

const MOCK_SMSCOUNT_PARAMS = {
  form: new ObjectId(),
  formAdmin: {
    email: 'mockEmail@example.com',
    userId: new ObjectId(),
  },
}

const MOCK_BOUNCED_SUBMISSION_PARAMS = {
  form: new ObjectId(),
  formAdmin: {
    email: 'a@abc.com',
    userId: new ObjectId(),
  },
  collaboratorEmail: 'b@def.com',
  recipientNumber: '+6581234567',
  msgSrvcSid: 'mockMsgSrvcSid',
  smsType: SmsType.BouncedSubmission,
  logType: LogType.success,
}

const MOCK_FORM_DEACTIVATED_PARAMS = {
  form: new ObjectId(),
  formAdmin: {
    email: 'a@abc.com',
    userId: new ObjectId(),
  },
  collaboratorEmail: 'b@def.com',
  recipientNumber: '+6581234567',
  msgSrvcSid: 'mockMsgSrvcSid',
  smsType: SmsType.DeactivatedForm,
  logType: LogType.success,
}

const MOCK_MSG_SRVC_SID = 'mockMsgSrvcSid'

describe('SmsCount', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('FormDeactivatedSmsCountSchema', () => {
    it('should create and save successfully', async () => {
      const saved = await SmsCount.create(MOCK_FORM_DEACTIVATED_PARAMS)

      expect(saved._id).toBeDefined()
      expect(saved.createdAt).toBeInstanceOf(Date)
      const actualSavedObject = omit(saved.toObject(), [
        '_id',
        'createdAt',
        '__v',
      ])
      expect(actualSavedObject).toEqual(MOCK_FORM_DEACTIVATED_PARAMS)
    })

    it('should reject if form is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_FORM_DEACTIVATED_PARAMS, 'form'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if formAdmin.email is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_FORM_DEACTIVATED_PARAMS, 'formAdmin.email'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if formAdmin.userId is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_FORM_DEACTIVATED_PARAMS, 'formAdmin.userId'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if collaboratorEmail is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_FORM_DEACTIVATED_PARAMS, 'collaboratorEmail'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if collaboratorEmail is invalid', async () => {
      const invalidSmsCount = new SmsCount(
        merge({}, MOCK_FORM_DEACTIVATED_PARAMS, {
          collaboratorEmail: 'invalid',
        }),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if recipientNumber is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_FORM_DEACTIVATED_PARAMS, 'recipientNumber'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if recipientNumber is invalid', async () => {
      const invalidSmsCount = new SmsCount(
        merge({}, MOCK_FORM_DEACTIVATED_PARAMS, {
          recipientNumber: 'invalid',
        }),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })
  })

  describe('BouncedSubmissionSmsCountSchema', () => {
    it('should create and save successfully', async () => {
      const saved = await SmsCount.create(MOCK_BOUNCED_SUBMISSION_PARAMS)

      expect(saved._id).toBeDefined()
      expect(saved.createdAt).toBeInstanceOf(Date)
      const actualSavedObject = omit(saved.toObject(), [
        '_id',
        'createdAt',
        '__v',
      ])
      expect(actualSavedObject).toEqual(MOCK_BOUNCED_SUBMISSION_PARAMS)
    })

    it('should reject if form is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_BOUNCED_SUBMISSION_PARAMS, 'form'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if formAdmin.email is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_BOUNCED_SUBMISSION_PARAMS, 'formAdmin.email'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if formAdmin.userId is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_BOUNCED_SUBMISSION_PARAMS, 'formAdmin.userId'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if collaboratorEmail is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_BOUNCED_SUBMISSION_PARAMS, 'collaboratorEmail'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if collaboratorEmail is invalid', async () => {
      const invalidSmsCount = new SmsCount(
        merge({}, MOCK_BOUNCED_SUBMISSION_PARAMS, {
          collaboratorEmail: 'invalid',
        }),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if recipientNumber is missing', async () => {
      const invalidSmsCount = new SmsCount(
        omit(MOCK_BOUNCED_SUBMISSION_PARAMS, 'recipientNumber'),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if recipientNumber is invalid', async () => {
      const invalidSmsCount = new SmsCount(
        merge({}, MOCK_BOUNCED_SUBMISSION_PARAMS, {
          recipientNumber: 'invalid',
        }),
      )

      await expect(invalidSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })
  })

  describe('VerificationCount Schema', () => {
    const twilioMsgSrvcSid = smsConfig.twilioMsgSrvcSid

    beforeAll(() => {
      smsConfig.twilioMsgSrvcSid = MOCK_MSG_SRVC_SID
    })

    afterAll(() => {
      smsConfig.twilioMsgSrvcSid = twilioMsgSrvcSid
    })

    it('should create and save successfully', async () => {
      // Arrange
      const smsCountParams = createVerificationSmsCountParams()
      const expected = merge(smsCountParams, {
        isOnboardedAccount: false,
      })

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
      expect(actualSavedObject).toEqual(expected)
    })

    it('should save successfully, but not save fields that is not defined in the schema', async () => {
      // Arrange
      const smsCountParamsWithExtra = merge(
        createVerificationSmsCountParams(),
        {
          extra: 'somethingExtra',
        },
      )
      const expected = merge(omit(smsCountParamsWithExtra, 'extra'), {
        isOnboardedAccount: false,
      })

      // Act
      const validSmsCount = new SmsCount(smsCountParamsWithExtra)
      const saved = await validSmsCount.save()

      // Assert
      // All defined fields should exist
      // Object Id should be defined when successfully saved to MongoDB.
      expect(saved._id).toBeDefined()
      // Extra key should not be saved
      expect(Object.keys(saved)).not.toContain('extra')
      expect(saved.createdAt).toBeInstanceOf(Date)
      // Retrieve object and compare to params, remove indeterministic keys
      const actualSavedObject = omit(saved.toObject(), [
        '_id',
        'createdAt',
        '__v',
      ])
      expect(actualSavedObject).toEqual(expected)
    })

    it('should save successfully and set isOnboarded to true when the credentials are different from default', async () => {
      // Arrange
      const verificationParams = merge(
        createVerificationSmsCountParams({
          logType: LogType.success,
          smsType: SmsType.Verification,
        }),
        { msgSrvcSid: 'i am different' },
      )

      // Act
      const validSmsCount = new SmsCount(verificationParams)
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
      ]) as IVerificationSmsCountSchema
      expect(omit(actualSavedObject, 'isOnboardedAccount')).toEqual(
        verificationParams,
      )
      expect(actualSavedObject.isOnboardedAccount).toBe(true)
    })

    it('should reject if form key is missing', async () => {
      // Arrange
      const malformedParams = omit(createVerificationSmsCountParams(), 'form')
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expect(malformedSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if formAdmin.email is missing', async () => {
      // Arrange
      const malformedParams = omit(
        createVerificationSmsCountParams(),
        'formAdmin.email',
      )
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expect(malformedSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if formAdmin.userId is missing', async () => {
      // Arrange
      const malformedParams = omit(
        createVerificationSmsCountParams(),
        'formAdmin.userId',
      )
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expect(malformedSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if logType is missing', async () => {
      // Arrange
      const malformedParams = omit(
        createVerificationSmsCountParams(),
        'logType',
      )
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expect(malformedSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if logType is invalid', async () => {
      // Arrange
      const malformedParams = createVerificationSmsCountParams()
      // @ts-ignore
      malformedParams.logType = 'INVALID_LOG_TYPE'
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expect(malformedSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if smsType is missing', async () => {
      // Arrange
      const malformedParams = omit(
        createVerificationSmsCountParams(),
        'smsType',
      )
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expect(malformedSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should reject if smsType is invalid', async () => {
      // Arrange
      const malformedParams = createVerificationSmsCountParams()
      // @ts-ignore
      malformedParams.smsType = 'INVALID_SMS_TYPE'
      const malformedSmsCount = new SmsCount(malformedParams)

      // Act + Assert
      await expect(malformedSmsCount.save()).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })
  })

  describe('Statics', () => {
    describe('logSms', () => {
      const MOCK_FORM_ID = MOCK_SMSCOUNT_PARAMS.form

      it('should correctly log bounced submission SMS successes', async () => {
        const saved = await SmsCount.logSms({
          logType: LogType.success,
          smsType: SmsType.BouncedSubmission,
          msgSrvcSid: MOCK_BOUNCED_SUBMISSION_PARAMS.msgSrvcSid,
          smsData: omit(MOCK_BOUNCED_SUBMISSION_PARAMS, [
            'msgSrvcSid',
            'smsType',
            'logType',
          ]),
        })

        expect(saved._id).toBeDefined()
        expect(saved.createdAt).toBeInstanceOf(Date)
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'createdAt',
          '__v',
        ])
        expect(actualSavedObject).toEqual(
          merge({}, MOCK_BOUNCED_SUBMISSION_PARAMS, {
            logType: LogType.success,
          }),
        )
      })

      it('should correctly log bounced submission SMS failures', async () => {
        const saved = await SmsCount.logSms({
          logType: LogType.failure,
          smsType: SmsType.BouncedSubmission,
          msgSrvcSid: MOCK_BOUNCED_SUBMISSION_PARAMS.msgSrvcSid,
          smsData: omit(MOCK_BOUNCED_SUBMISSION_PARAMS, [
            'msgSrvcSid',
            'smsType',
            'logType',
          ]),
        })

        expect(saved._id).toBeDefined()
        expect(saved.createdAt).toBeInstanceOf(Date)
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'createdAt',
          '__v',
        ])
        expect(actualSavedObject).toEqual(
          merge({}, MOCK_BOUNCED_SUBMISSION_PARAMS, {
            logType: LogType.failure,
          }),
        )
      })

      it('should correctly log form deactivated SMS successes', async () => {
        const saved = await SmsCount.logSms({
          logType: LogType.success,
          smsType: SmsType.DeactivatedForm,
          msgSrvcSid: MOCK_FORM_DEACTIVATED_PARAMS.msgSrvcSid,
          smsData: omit(MOCK_FORM_DEACTIVATED_PARAMS, [
            'msgSrvcSid',
            'smsType',
            'logType',
          ]),
        })

        expect(saved._id).toBeDefined()
        expect(saved.createdAt).toBeInstanceOf(Date)
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'createdAt',
          '__v',
        ])
        expect(actualSavedObject).toEqual(
          merge({}, MOCK_FORM_DEACTIVATED_PARAMS, { logType: LogType.success }),
        )
      })

      it('should correctly log form deactivated SMS failures', async () => {
        const saved = await SmsCount.logSms({
          logType: LogType.failure,
          smsType: SmsType.DeactivatedForm,
          msgSrvcSid: MOCK_FORM_DEACTIVATED_PARAMS.msgSrvcSid,
          smsData: omit(MOCK_FORM_DEACTIVATED_PARAMS, [
            'msgSrvcSid',
            'smsType',
            'logType',
          ]),
        })

        expect(saved._id).toBeDefined()
        expect(saved.createdAt).toBeInstanceOf(Date)
        const actualSavedObject = omit(saved.toObject(), [
          '_id',
          'createdAt',
          '__v',
        ])
        expect(actualSavedObject).toEqual(
          merge({}, MOCK_FORM_DEACTIVATED_PARAMS, { logType: LogType.failure }),
        )
      })

      it('should successfully log verification successes in the collection', async () => {
        // Arrange
        const initialCount = await SmsCount.countDocuments({})

        // Act
        const expectedLog = await logAndReturnExpectedLog({
          smsType: SmsType.Verification,
          logType: LogType.success,
        })

        // Assert
        const afterCount = await SmsCount.countDocuments({})
        // Should have 1 more document in the database since it is successful
        expect(afterCount).toEqual(initialCount + 1)

        // Should contain OTP data and the correct sms/log type.
        const actualLog = await SmsCount.findOne({
          form: MOCK_FORM_ID,
        }).lean()

        expect(actualLog?._id).toBeDefined()
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(actualLog, ['_id', 'createdAt', '__v'])
        expect(actualSavedObject).toEqual(expectedLog)
      })

      it('should successfully log verification failures in the collection', async () => {
        // Arrange
        const initialCount = await SmsCount.countDocuments({})

        // Act
        const expectedLog = await logAndReturnExpectedLog({
          smsType: SmsType.Verification,
          logType: LogType.failure,
        })

        // Assert
        const afterCount = await SmsCount.countDocuments({})
        // Should have 1 more document in the database since it is successful
        expect(afterCount).toEqual(initialCount + 1)

        // Should contain OTP data and the correct sms/log type.
        const actualLog = await SmsCount.findOne({
          form: MOCK_FORM_ID,
        }).lean()

        expect(actualLog?._id).toBeDefined()
        // Retrieve object and compare to params, remove indeterministic keys
        const actualSavedObject = omit(actualLog, ['_id', 'createdAt', '__v'])
        expect(actualSavedObject).toEqual(expectedLog)
      })

      it('should reject if smsType is invalid', async () => {
        await expect(
          logAndReturnExpectedLog({
            // @ts-ignore
            smsType: 'INVALID',
            logType: LogType.failure,
          }),
        ).rejects.toThrow(mongoose.Error.ValidationError)
      })

      it('should reject if logType is invalid', async () => {
        await expect(
          logAndReturnExpectedLog({
            smsType: SmsType.Verification,
            // @ts-ignore
            logType: 'INVALID',
          }),
        ).rejects.toThrow(mongoose.Error.ValidationError)
      })
    })
  })
})

const createVerificationSmsCountParams = ({
  logType = LogType.success,
  smsType = SmsType.Verification,
}: {
  logType?: LogType
  smsType?: SmsType
} = {}) => {
  const smsCountParams: Partial<IVerificationSmsCount> =
    cloneDeep(MOCK_SMSCOUNT_PARAMS)
  smsCountParams.logType = logType
  smsCountParams.smsType = smsType
  smsCountParams.msgSrvcSid = MOCK_MSG_SRVC_SID
  return smsCountParams
}

const logAndReturnExpectedLog = async ({
  logType,
  smsType,
}: {
  logType: LogType
  smsType: SmsType
}) => {
  await SmsCount.logSms({
    smsData: MOCK_SMSCOUNT_PARAMS,
    msgSrvcSid: MOCK_MSG_SRVC_SID,
    smsType,
    logType,
  })

  const expectedLog = {
    ...MOCK_SMSCOUNT_PARAMS,
    msgSrvcSid: MOCK_MSG_SRVC_SID,
    smsType,
    logType,
    ...(smsType === SmsType.Verification && {
      isOnboardedAccount: !(MOCK_MSG_SRVC_SID === smsConfig.twilioMsgSrvcSid),
    }),
  }

  return expectedLog
}
