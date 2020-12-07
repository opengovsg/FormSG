import { ObjectId } from 'bson'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import { IFormSchema, IPopulatedForm, Status } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { ApplicationError, DatabaseError } from '../../core/core.errors'
import {
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../form.errors'
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

  describe('isFormPublic', () => {
    it('should return true when form is public', async () => {
      // Arrange
      const form = {
        _id: new ObjectId(),
        // Form public.
        status: Status.Public,
      } as IPopulatedForm

      // Act
      const actual = FormService.isFormPublic(form)

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(true)
    })

    it('should return FormDeletedError when form has been deleted', async () => {
      // Arrange
      const form = {
        _id: new ObjectId(),
        // Form deleted.
        status: Status.Archived,
      } as IPopulatedForm

      // Act
      const actual = FormService.isFormPublic(form)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FormDeletedError())
    })

    it('should return PrivateFormError with form inactive message when form is private', async () => {
      // Arrange
      const form = {
        _id: new ObjectId(),
        // Form private.
        status: Status.Private,
        inactiveMessage: 'test inactive message',
      } as IPopulatedForm

      // Act
      const actual = FormService.isFormPublic(form)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(
        new PrivateFormError(form.inactiveMessage),
      )
    })

    it('should return error with error message override when available', async () => {
      // Arrange
      const expectedErrorMessage = 'test error message override'
      const form = {
        _id: new ObjectId(),
        // Form deleted.
        status: Status.Archived,
      } as IPopulatedForm

      // Act
      const actual = FormService.isFormPublic(form, expectedErrorMessage)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(
        new FormDeletedError(expectedErrorMessage),
      )
    })

    it('should return ApplicationError when form does not have status', async () => {
      // Arrange
      const expectedErrorMessage = 'test error message override'
      const form = {
        _id: new ObjectId(),
        // Form without status.
      } as IPopulatedForm

      // Act
      const actual = FormService.isFormPublic(form, expectedErrorMessage)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new ApplicationError())
    })
  })
})
