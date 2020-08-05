const dbHandler = require('../helpers/db-handler')
const mongoose = require('mongoose')
const Verification = spec(
  'dist/backend/app/models/verification.server.model',
).default(mongoose)
const { omit, merge, pick } = require('lodash')
const { ObjectId } = require('bson-ext')

const VFN_FIELD_DEFAULTS = {
  signedData: null,
  hashedOtp: null,
  hashCreatedAt: null,
  hashRetries: 0,
}

const generateFieldParams = () => {
  const mockParams = {
    fieldType: 'mockField',
    _id: String(new ObjectId()),
  }
  return merge({}, VFN_FIELD_DEFAULTS, mockParams)
}

const VFN_PARAMS = {
  formId: new ObjectId(),
}

const VFN_DEFAULTS = {
  fields: [],
}

describe('Verification Model', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    it('should create and save successfully with defaults', async () => {
      const verification = new Verification(VFN_PARAMS)
      const verificationSaved = await verification.save()
      expect(verificationSaved._id).toBeDefined()
      expect(verificationSaved.expireAt).toBeInstanceOf(Date)
      const actualSavedFields = omit(verificationSaved.toObject(), [
        '_id',
        'expireAt',
        '__v',
      ])
      const expectedSavedFields = merge({}, VFN_DEFAULTS, VFN_PARAMS)
      expect(actualSavedFields).toEqual(expectedSavedFields)
    })

    it('should create and save successfully with expireAt specified', async () => {
      const params = merge({}, VFN_PARAMS, { expireAt: new Date() })
      const verification = new Verification(params)
      const verificationSaved = await verification.save()
      expect(verificationSaved._id).toBeDefined()
      const actualSavedFields = omit(verificationSaved.toObject(), [
        '_id',
        '__v',
      ])
      const expectedSavedFields = merge({}, VFN_DEFAULTS, params)
      expect(actualSavedFields).toEqual(expectedSavedFields)
    })

    it('should create and save successfully with default fields', async () => {
      const vfnParams = merge({}, VFN_PARAMS, {
        fields: [generateFieldParams(), generateFieldParams()],
      })
      const verification = new Verification(vfnParams)
      const verificationSaved = await verification.save()
      expect(verificationSaved._id).toBeDefined()
      const actualSavedFields = omit(verificationSaved.toObject(), [
        '_id',
        'expireAt',
        '__v',
      ])
      const expectedSavedFields = merge({}, VFN_DEFAULTS, VFN_PARAMS, vfnParams)
      expect(actualSavedFields).toEqual(expectedSavedFields)
    })

    it('should create and save successfully with field keys specified', async () => {
      const field = merge({}, generateFieldParams(), {
        signedData: 'signedData',
        hashedOtp: 'hashedOtp',
        hashCreatedAt: new Date(),
        hashRetries: 5,
      })
      const vfnParams = merge({}, VFN_PARAMS, { fields: [field] })
      const verification = new Verification(vfnParams)
      const verificationSaved = await verification.save()
      expect(verificationSaved._id).toBeDefined()
      const actualSavedFields = omit(verificationSaved.toObject(), [
        '_id',
        'expireAt',
        '__v',
      ])
      const expectedSavedFields = merge({}, VFN_DEFAULTS, VFN_PARAMS, vfnParams)
      expect(actualSavedFields).toEqual(expectedSavedFields)
    })

    it('should reject attempts to save identical field IDs', async () => {
      const field = generateFieldParams()
      const vfnParams = merge({}, VFN_PARAMS, {
        fields: [field, field],
      })
      const verification = new Verification(vfnParams)
      await expectAsync(verification.save()).toBeRejected()
    })
  })

  describe('Statics', () => {
    describe('findTransactionMetadata', () => {
      it('should only return non-sensitive fields', async () => {
        const verification = new Verification(VFN_PARAMS)
        const verificationSaved = await verification.save()
        expect(verificationSaved._id).toBeDefined()
        const found = await Verification.findTransactionMetadata(
          verificationSaved._id,
        )
        const actual = found.toObject()
        const expected = pick(verificationSaved, ['formId', 'expireAt', '_id'])
        expect(actual).toEqual(expected)
      })
    })
  })
})
