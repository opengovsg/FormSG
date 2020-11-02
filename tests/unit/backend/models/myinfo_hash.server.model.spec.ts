import { ObjectId } from 'bson'
import { omit, pick } from 'lodash'
import mongoose from 'mongoose'

import getMyInfoHashModel from 'src/app/models/myinfo_hash.server.model'

import dbHandler from '../helpers/jest-db'

const MyInfoHash = getMyInfoHashModel(mongoose)

const DEFAULT_PARAMS = {
  uinFin: 'testUinFin',
  form: new ObjectId(),
  fields: { name: 'mockHash' },
  expireAt: new Date(Date.now()),
  created: new Date(Date.now()),
}
const DEFAULT_COOKIE_MAX_AGE = 5

describe('MyInfo Hash Model', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('Schema', () => {
    it('should create and save successfully', async () => {
      // Act
      const actual = await MyInfoHash.create(DEFAULT_PARAMS)

      // Assert
      // All fields should exist
      // Object Id should be defined when successfully saved to MongoDB.
      expect(actual._id).toBeDefined()
      expect(
        pick(actual, ['uinFin', 'form', 'fields', 'created', 'expireAt']),
      ).toEqual(DEFAULT_PARAMS)
    })

    it('should throw validation error on missing uinFin', async () => {
      // Arrange
      const missingParams = omit(DEFAULT_PARAMS, 'uinFin')

      // Act
      const myInfoHash = new MyInfoHash(missingParams)
      const actualPromise = myInfoHash.save()

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error on missing form', async () => {
      // Arrange
      const missingParams = omit(DEFAULT_PARAMS, 'form')

      // Act
      const myInfoHash = new MyInfoHash(missingParams)
      const actualPromise = myInfoHash.save()

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error on missing fields', async () => {
      // Arrange
      const missingParams = omit(DEFAULT_PARAMS, 'fields')

      // Act
      const myInfoHash = new MyInfoHash(missingParams)
      const actualPromise = myInfoHash.save()

      // Assert
      await expect(actualPromise).rejects.toThrowError(
        mongoose.Error.ValidationError,
      )
    })

    it('should throw validation error on missing expireAt', async () => {
      // Arrange
      const missingParams = omit(DEFAULT_PARAMS, 'expireAt')

      // Act
      const myInfoHash = new MyInfoHash(missingParams)
      const actualPromise = myInfoHash.save()

      // Assert
      await expect(actualPromise).rejects.toThrowError(
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
        const actual = await MyInfoHash.updateHashes(
          DEFAULT_PARAMS.uinFin,
          DEFAULT_PARAMS.form.toHexString(),
          DEFAULT_PARAMS.fields,
          DEFAULT_COOKIE_MAX_AGE,
        )

        // Assert
        // Should now have one document.
        await expect(MyInfoHash.countDocuments()).resolves.toEqual(1)
        const found = await MyInfoHash.findOne({})
        // Both the returned document and the found document should match
        expect(pick(actual, ['uinFin', 'form', 'fields'])).toEqual(
          pick(DEFAULT_PARAMS, ['uinFin', 'form', 'fields']),
        )
        expect(pick(found, ['uinFin', 'form', 'fields'])).toEqual(
          pick(DEFAULT_PARAMS, ['uinFin', 'form', 'fields']),
        )
      })

      it('should update successfully when a document already exists', async () => {
        // Arrange
        // Insert mock document into collection.
        await MyInfoHash.create(DEFAULT_PARAMS)
        // Should have the added document.
        await expect(MyInfoHash.countDocuments()).resolves.toEqual(1)

        const mockFields = { sex: 'F' }

        // Act
        const actual = await MyInfoHash.updateHashes(
          DEFAULT_PARAMS.uinFin,
          DEFAULT_PARAMS.form.toHexString(),
          mockFields,
          DEFAULT_COOKIE_MAX_AGE,
        )
        // Assert
        await expect(MyInfoHash.countDocuments()).resolves.toEqual(1)
        const found = await MyInfoHash.findOne({})
        // Both the returned document and the found document should match
        expect(actual!.fields).toEqual(mockFields)
        expect(found!.fields).toEqual(mockFields)
      })
    })
  })
})
