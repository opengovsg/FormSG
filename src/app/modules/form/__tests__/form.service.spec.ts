import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import { IFormSchema, IPopulatedForm } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { DatabaseError } from '../../core/core.errors'
import { FormNotFoundError } from '../form.errors'
import * as FormService from '../form.service'

const MOCK_FORM_ID = new ObjectId()
const Form = getFormModel(mongoose)

describe('FormService', () => {
  beforeAll(async () => await dbHandler.connect())

  afterEach(() => jest.clearAllMocks())

  afterAll(async () => {
    await dbHandler.clearDatabase()
    await dbHandler.closeDatabase()
  })

  describe('deactivateForm', () => {
    it('should call Form.deactivateById', async () => {
      const mock = jest.spyOn(Form, 'deactivateById')
      await FormService.deactivateForm(String(MOCK_FORM_ID))
      expect(mock).toHaveBeenCalledWith(String(MOCK_FORM_ID))
    })
  })

  describe('retrieveFullFormById', () => {
    it('should return full populated form successfully', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      const expectedForm = ({
        _id: formId,
        title: 'mock title',
        admin: {
          _id: new ObjectId(),
          email: 'mockEmail@example.com',
        },
      } as unknown) as IPopulatedForm
      const retrieveFormSpy = jest
        .spyOn(Form, 'getFullFormById')
        .mockResolvedValueOnce(expectedForm)

      // Act
      const actualResult = await FormService.retrieveFullFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
    })

    it('should return FormNotFoundError if formId is invalid', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      // Resolve query to null.
      const retrieveFormSpy = jest
        .spyOn(Form, 'getFullFormById')
        .mockResolvedValueOnce(null)

      // Act
      const actualResult = await FormService.retrieveFullFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(FormNotFoundError)
    })

    it('should return FormNotFoundError when retrieved form does not contain admin', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      const expectedForm = ({
        _id: formId,
        title: 'mock title',
        // Note no admin key-value.
      } as unknown) as IPopulatedForm
      const retrieveFormSpy = jest
        .spyOn(Form, 'getFullFormById')
        .mockResolvedValueOnce(expectedForm)

      // Act
      const actualResult = await FormService.retrieveFullFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(FormNotFoundError)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      // Mock rejection.
      const retrieveFormSpy = jest
        .spyOn(Form, 'getFullFormById')
        .mockRejectedValueOnce(new Error('Some error'))

      // Act
      const actualResult = await FormService.retrieveFullFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('retrieveFormById', () => {
    it('should return form successfully', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      const expectedForm = {
        _id: formId,
        title: 'mock title',
        admin: new ObjectId(),
      } as IFormSchema
      const retrieveFormSpy = jest
        .spyOn(Form, 'findById')
        .mockReturnValueOnce(({
          exec: jest.fn().mockResolvedValue(expectedForm),
        } as unknown) as mongoose.Query<any>)

      // Act
      const actualResult = await FormService.retrieveFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
    })

    it('should return FormNotFoundError if formId is invalid', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      // Resolve query to null.
      const retrieveFormSpy = jest
        .spyOn(Form, 'findById')
        .mockReturnValueOnce(({
          exec: jest.fn().mockResolvedValue(null),
        } as unknown) as mongoose.Query<any>)

      // Act
      const actualResult = await FormService.retrieveFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(FormNotFoundError)
    })

    it('should return FormNotFoundError when retrieved form does not contain admin', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      const expectedForm = {
        _id: formId,
        title: 'mock title',
        // Note no admin key-value.
      } as IFormSchema
      const retrieveFormSpy = jest
        .spyOn(Form, 'findById')
        .mockReturnValueOnce(({
          exec: jest.fn().mockResolvedValue(expectedForm),
        } as unknown) as mongoose.Query<any>)

      // Act
      const actualResult = await FormService.retrieveFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(FormNotFoundError)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      // Mock rejection.
      const retrieveFormSpy = jest
        .spyOn(Form, 'findById')
        .mockReturnValueOnce(({
          exec: jest.fn().mockRejectedValue(new Error('some error')),
        } as unknown) as mongoose.Query<any>)

      // Act
      const actualResult = await FormService.retrieveFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })
})
