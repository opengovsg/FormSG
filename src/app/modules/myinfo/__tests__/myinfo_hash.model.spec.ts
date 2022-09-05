import { ObjectId } from 'bson'
import crypto from 'crypto'
import { omit, pick } from 'lodash'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import config from 'src/app/config/config'

import dbHandler from '../../../../../tests/unit/backend/helpers/jest-db'

jest.mock('src/app/config/config')
const MockConfig = mocked(config, true)

// eslint-disable-next-line import/first
import getMyInfoHashModel from 'src/app/modules/myinfo/myinfo_hash.model'

const MyInfoHash = getMyInfoHashModel(mongoose)

const MOCK_SESSION_SECRET = 'mockSecret'
const DEFAULT_INPUT_PARAMS = {
  uinFin: 'testUinFin',
  form: new ObjectId(),
  fields: { name: 'mockHash' },
  expireAt: new Date(Date.now()),
  created: new Date(Date.now()),
}
const DEFAULT_HASHED_UINFIN = crypto
  .createHmac('sha256', MOCK_SESSION_SECRET)
  .update(DEFAULT_INPUT_PARAMS.uinFin)
  .digest('hex')
const DEFAULT_SAVED_PARAMS = {
  ...DEFAULT_INPUT_PARAMS,
  uinFin: DEFAULT_HASHED_UINFIN,
}
const DEFAULT_COOKIE_MAX_AGE = 5

describe('MyInfo Hash Model', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    MockConfig.sessionSecret = MOCK_SESSION_SECRET
  })
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    it('should create and save successfully', async () => {
      // Act
      const actual = await MyInfoHash.create(DEFAULT_INPUT_PARAMS)

      // Assert
      // All fields should exist
      // Object Id should be defined when successfully saved to MongoDB.
      expect(actual._id).toBeDefined()
      expect(
        pick(actual, ['uinFin', 'form', 'fields', 'created', 'expireAt']),
      ).toEqual(DEFAULT_INPUT_PARAMS)
    })

    it('should throw validation error on missing uinFin', async () => {
      // Arrange
      const missingParams = omit(DEFAULT_INPUT_PARAMS, 'uinFin')

      // Act
      const myInfoHash = new MyInfoHash(missingParams)
      const actualPromise = myInfoHash.save()

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error on missing form', async () => {
      // Arrange
      const missingParams = omit(DEFAULT_INPUT_PARAMS, 'form')

      // Act
      const myInfoHash = new MyInfoHash(missingParams)
      const actualPromise = myInfoHash.save()

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error on missing fields', async () => {
      // Arrange
      const missingParams = omit(DEFAULT_INPUT_PARAMS, 'fields')

      // Act
      const myInfoHash = new MyInfoHash(missingParams)
      const actualPromise = myInfoHash.save()

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error on missing expireAt', async () => {
      // Arrange
      const missingParams = omit(DEFAULT_INPUT_PARAMS, 'expireAt')

      // Act
      const myInfoHash = new MyInfoHash(missingParams)
      const actualPromise = myInfoHash.save()

      // Assert
      await expect(actualPromise).rejects.toThrow(
        mongoose.Error.ValidationError,
      )
    })
  })

  describe('Statics', () => {
    describe('updateHashes', () => {
      it('should create successfully when document does not exist', async () => {
        // Should have no documents yet.
        await expect(MyInfoHash.countDocuments()).resolves.toEqual(0)

        // Act
        // Note: we are passing the PLAIN uinFin
        const actual = await MyInfoHash.updateHashes(
          DEFAULT_INPUT_PARAMS.uinFin,
          DEFAULT_INPUT_PARAMS.form.toHexString(),
          DEFAULT_INPUT_PARAMS.fields,
          DEFAULT_COOKIE_MAX_AGE,
        )

        // Assert
        // Should now have one document.
        await expect(MyInfoHash.countDocuments()).resolves.toEqual(1)
        const found = await MyInfoHash.findOne({})
        // Both the returned document and the found document should match
        // Note: we are checking that the document contains the HASHED uinFin
        expect(pick(actual, ['uinFin', 'form', 'fields'])).toEqual(
          pick(DEFAULT_SAVED_PARAMS, ['uinFin', 'form', 'fields']),
        )
        expect(pick(found, ['uinFin', 'form', 'fields'])).toEqual(
          pick(DEFAULT_SAVED_PARAMS, ['uinFin', 'form', 'fields']),
        )
      })

      it('should update successfully when a document already exists', async () => {
        // Arrange
        // Insert mock document into collection.
        // Note: we are inserting the HASHED uinFin directly.
        await MyInfoHash.create(DEFAULT_SAVED_PARAMS)
        // Should have the added document.
        await expect(MyInfoHash.countDocuments()).resolves.toEqual(1)

        const mockFields = { sex: 'F' }

        // Act
        // Note: we are passing the PLAIN uinFin and checking that it gets hashed
        const actual = await MyInfoHash.updateHashes(
          DEFAULT_INPUT_PARAMS.uinFin,
          DEFAULT_INPUT_PARAMS.form.toHexString(),
          mockFields,
          DEFAULT_COOKIE_MAX_AGE,
        )
        // Assert
        await expect(MyInfoHash.countDocuments()).resolves.toEqual(1)
        const found = await MyInfoHash.findOne({})
        // Both the returned document and the found document should match
        expect(actual!.fields).toEqual(mockFields)
        expect(found!.fields).toEqual(mockFields)

        expect(actual!.uinFin).toBe(DEFAULT_HASHED_UINFIN)
        expect(found!.uinFin).toEqual(DEFAULT_HASHED_UINFIN)
      })
    })

    describe('findHashes', () => {
      it('should find the correct document', async () => {
        // Arrange
        // Insert mock document into collection.
        // Note: we are inserting the HASHED uinFin directly.
        await MyInfoHash.create(DEFAULT_SAVED_PARAMS)
        // Should have the added document.
        await expect(MyInfoHash.countDocuments()).resolves.toEqual(1)

        // Act
        // Note: we are passing the PLAIN uinFin and checking that it gets hashed
        const actual = await MyInfoHash.findHashes(
          DEFAULT_INPUT_PARAMS.uinFin,
          DEFAULT_INPUT_PARAMS.form.toHexString(),
        )
        // Assert
        // Both the returned document and the found document should match
        expect(actual).toEqual(DEFAULT_SAVED_PARAMS.fields)
      })
    })
  })
})
