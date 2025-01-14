import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import { merge, times } from 'lodash'
import mongoose from 'mongoose'

import getFormModel from 'src/app/models/form.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import { IFormSchema, IPopulatedForm } from 'src/types'

import {
  FormResponseMode,
  FormStatus,
  SubmissionType,
} from '../../../../../shared/types'
import { ApplicationError, DatabaseError } from '../../core/core.errors'
import {
  FormDeletedError,
  FormNotFoundError,
  PrivateFormError,
} from '../form.errors'
import * as FormService from '../form.service'

const MOCK_FORM_ID = new ObjectId()
const Form = getFormModel(mongoose)
const Submission = getSubmissionModel(mongoose)

const MOCK_ADMIN_OBJ_ID = new ObjectId()
const MOCK_FORM_PARAMS = {
  title: 'Test Form',
  admin: String(MOCK_ADMIN_OBJ_ID),
}
const MOCK_ENCRYPTED_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  publicKey: 'mockPublicKey',
  responseMode: FormResponseMode.Encrypt,
}

describe('FormService', () => {
  beforeAll(async () => {
    await dbHandler.connect()
    await dbHandler.insertFormCollectionReqs({
      userId: MOCK_ADMIN_OBJ_ID,
    })
  })

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
      const expectedForm = {
        _id: formId,
        title: 'mock title',
        admin: {
          _id: new ObjectId(),
          email: 'mockEmail@example.com',
        },
      } as unknown as IPopulatedForm
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
      const expectedForm = {
        _id: formId,
        title: 'mock title',
        // Note no admin key-value.
      } as unknown as IPopulatedForm
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

  describe('retrieveFormKeysById', () => {
    it('should return form successfully', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      const expectedForm = {
        _id: formId,
        title: 'mock title',
        admin: {
          _id: new ObjectId(),
          email: 'mockEmail@example.com',
        },
      } as unknown as IPopulatedForm
      const retrieveFormSpy = jest
        .spyOn(Form, 'getFullFormById')
        .mockResolvedValueOnce(expectedForm)

      // Act
      const actualResult = await FormService.retrieveFormKeysById(formId, [
        'title',
        'admin',
      ])

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
      const actualResult = await FormService.retrieveFormKeysById(formId, [
        'title',
        'admin',
      ])

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(FormNotFoundError)
    })

    it('should still return retrieved form even when it does not contain admin', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      const expectedForm = {
        _id: formId,
        title: 'mock title',
        // Note no admin key-value.
      } as unknown as IPopulatedForm
      const retrieveFormSpy = jest
        .spyOn(Form, 'getFullFormById')
        .mockResolvedValueOnce(expectedForm)

      // Act
      const actualResult = await FormService.retrieveFormKeysById(formId, [
        'title',
      ])

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isOk()).toEqual(true)
      expect(actualResult._unsafeUnwrap()).toEqual(expectedForm)
    })

    it('should return DatabaseError when error occurs whilst querying database', async () => {
      // Arrange
      const formId = new ObjectId().toHexString()
      // Mock rejection.
      const retrieveFormSpy = jest
        .spyOn(Form, 'getFullFormById')
        .mockRejectedValueOnce(new Error('Some error'))

      // Act
      const actualResult = await FormService.retrieveFormKeysById(formId, [
        'title',
        'admin',
      ])

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
      const retrieveFormSpy = jest.spyOn(Form, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(expectedForm),
      } as unknown as mongoose.Query<any, any>)

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
      const retrieveFormSpy = jest.spyOn(Form, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      } as unknown as mongoose.Query<any, any>)

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
      const retrieveFormSpy = jest.spyOn(Form, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(expectedForm),
      } as unknown as mongoose.Query<any, any>)

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
      const retrieveFormSpy = jest.spyOn(Form, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockRejectedValue(new Error('some error')),
      } as unknown as mongoose.Query<any, any>)

      // Act
      const actualResult = await FormService.retrieveFormById(formId)

      // Assert
      expect(retrieveFormSpy).toHaveBeenCalledTimes(1)
      expect(actualResult.isErr()).toEqual(true)
      expect(actualResult._unsafeUnwrapErr()).toBeInstanceOf(DatabaseError)
    })
  })

  describe('checkFormSubmissionLimitAndDeactivateForm', () => {
    it('should let requests through when form has no submission limit', async () => {
      // Arrange
      const form = {
        _id: new ObjectId(),
        submissionLimit: null,
      } as IPopulatedForm

      // Act
      const actual =
        await FormService.checkFormSubmissionLimitAndDeactivateForm(form)

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(form)
    })

    it('should return the form when the submission limit is not reached', async () => {
      // Arrange
      const formParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
        status: FormStatus.Public,
        submissionLimit: 10,
      })
      const validForm = new Form(formParams)
      const form = await validForm.save()

      const submissionPromises = times(5, () =>
        Submission.create({
          form: form._id,
          myInfoFields: [],
          submissionType: SubmissionType.Encrypt,
          encryptedContent: 'mockEncryptedContent',
          version: 1,
          created: new Date('2020-01-01'),
        }),
      )
      await Promise.all(submissionPromises)

      // Act
      const actual =
        await FormService.checkFormSubmissionLimitAndDeactivateForm(
          form as IPopulatedForm,
        )

      // Assert
      expect(actual._unsafeUnwrap()).toEqual(validForm)
    })

    it('should not let requests through and deactivate form when form has reached submission limit', async () => {
      // Arrange
      const formParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
        status: FormStatus.Public,
        submissionLimit: 5,
      })
      const validForm = new Form(formParams)
      const form = (await validForm.save()) as IPopulatedForm

      const submissionPromises = times(5, () =>
        Submission.create({
          form: form._id,
          myInfoFields: [],
          submissionType: SubmissionType.Encrypt,
          encryptedContent: 'mockEncryptedContent',
          version: 1,
          created: new Date('2020-01-01'),
        }),
      )
      await Promise.all(submissionPromises)

      // Act
      const actual =
        await FormService.checkFormSubmissionLimitAndDeactivateForm(form)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(
        new PrivateFormError(
          'Submission made after form submission limit was reached',
          form.title,
        ),
      )
      const updated = await Form.findById(form._id)
      expect(updated!.status).toBe('PRIVATE')
    })
  })

  describe('isFormPublic', () => {
    it('should return true when form is public', async () => {
      // Arrange
      const form = {
        _id: new ObjectId(),
        // Form public.
        status: FormStatus.Public,
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
        status: FormStatus.Archived,
      } as IPopulatedForm

      // Act
      const actual = FormService.isFormPublic(form)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new FormDeletedError())
    })

    it('should return PrivateFormError with form inactive message and title when form is private', async () => {
      // Arrange
      const form = {
        _id: new ObjectId(),
        // Form private.
        status: FormStatus.Private,
        inactiveMessage: 'test inactive message',
      } as IPopulatedForm

      // Act
      const actual = FormService.isFormPublic(form)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(
        new PrivateFormError(form.inactiveMessage, form.title),
      )
    })

    it('should return ApplicationError when form does not have status', async () => {
      // Arrange
      const form = {
        _id: new ObjectId(),
        // Form without status.
      } as IPopulatedForm

      // Act
      const actual = FormService.isFormPublic(form)

      // Assert
      expect(actual._unsafeUnwrapErr()).toEqual(new ApplicationError())
    })
  })
})
