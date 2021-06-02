/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson'
import MockAxios from 'jest-mock-axios'

import { FormUpdateParams } from 'src/app/modules/form/admin-form/admin-form.types'
import { BasicField, IPopulatedForm, IYesNoFieldSchema } from 'src/types'
import {
  EmailSubmissionDto,
  EncryptSubmissionDto,
  SubmissionResponseDto,
} from 'src/types/api'

import * as SubmissionUtil from '../../utils/submission'
import {
  ADMIN_FORM_ENDPOINT,
  submitEmailModeFormPreview,
  submitStorageModeFormPreview,
  transferOwner,
  updateForm,
} from '../UpdateFormService'

jest.mock('axios', () => MockAxios)

describe('UpdateFormService', () => {
  describe('submitEmailModeFormPreview', () => {
    const MOCK_FORM_ID = 'mock–form-id'
    const MOCK_RESPONSE: SubmissionResponseDto = {
      message: 'some mock response',
      submissionId: 'created submission id',
    }
    const MOCK_CONTENT: EmailSubmissionDto = {
      responses: [
        {
          question: 'some question',
          answer: 'some answer',
          fieldType: BasicField.ShortText,
          _id: 'some_id',
        },
      ],
    }

    it('should call api with correct form data and params successfully when captcha is provided', async () => {
      // Arrange
      const mockCaptcha = 'some captcha response'
      const expectedFormData = 'form data returned imagine this is a form data'
      const createFormDataSpy = jest
        .spyOn(SubmissionUtil, 'createEmailSubmissionFormData')
        // Ignore wrong type; just checking that the util is ran and returns expected.
        // @ts-ignore
        .mockReturnValueOnce(expectedFormData)

      // Act
      const actual = submitEmailModeFormPreview({
        formId: MOCK_FORM_ID,
        content: MOCK_CONTENT,
        captchaResponse: mockCaptcha,
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `/api/v3/admin/forms/${MOCK_FORM_ID}/preview/submissions/email`,
        expectedFormData,
        { params: { captchaResponse: mockCaptcha } },
      )
      expect(createFormDataSpy).toHaveBeenCalledWith({
        content: MOCK_CONTENT,
      })
    })

    it('should call api with correct form data and params successfully when captcha is not provided', async () => {
      // Arrange
      const expectedFormData =
        'form data returned imagine this is another form data'
      const createFormDataSpy = jest
        .spyOn(SubmissionUtil, 'createEmailSubmissionFormData')
        // Ignore wrong type; just checking that the util is ran and returns expected.
        // @ts-ignore
        .mockReturnValueOnce(expectedFormData)

      // Act
      const actual = submitEmailModeFormPreview({
        formId: MOCK_FORM_ID,
        content: MOCK_CONTENT,
        // No captcha entered
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `/api/v3/admin/forms/${MOCK_FORM_ID}/preview/submissions/email`,
        expectedFormData,
        // Should default to stringified null
        { params: { captchaResponse: 'null' } },
      )
      expect(createFormDataSpy).toHaveBeenCalledWith({
        content: MOCK_CONTENT,
      })
    })
  })

  describe('submitStorageModeFormPreview', () => {
    const MOCK_FORM_ID = 'mock–form-id-2'
    const MOCK_RESPONSE: SubmissionResponseDto = {
      message: 'some mock response again',
      submissionId: 'created submission id again',
    }
    const MOCK_CONTENT: EncryptSubmissionDto = {
      responses: [
        {
          question: 'some question',
          answer: 'some answer',
          fieldType: BasicField.ShortText,
          _id: 'some_id',
        },
      ],
      encryptedContent: 'encryptedContent1337H@xx0r',
      version: 1,
    }

    it('should call api with correct params successfully when captcha is provided', async () => {
      // Arrange
      const mockCaptcha = 'some captcha response'

      // Act
      const actual = submitStorageModeFormPreview({
        formId: MOCK_FORM_ID,
        content: MOCK_CONTENT,
        captchaResponse: mockCaptcha,
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `/api/v3/admin/forms/${MOCK_FORM_ID}/preview/submissions/encrypt`,
        MOCK_CONTENT,
        { params: { captchaResponse: mockCaptcha } },
      )
    })

    it('should call api with correct params successfully when captcha is not provided', async () => {
      // Act
      const actual = submitStorageModeFormPreview({
        formId: MOCK_FORM_ID,
        content: MOCK_CONTENT,
        // No captcha entered
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `/api/v3/admin/forms/${MOCK_FORM_ID}/preview/submissions/encrypt`,
        MOCK_CONTENT,
        // Should default to stringified null
        { params: { captchaResponse: 'null' } },
      )
    })
  })

  describe('updateForm', () => {
    it('should return updated form if PUT request succeeds', async () => {
      // Arrange
      const expected = [{} as IYesNoFieldSchema]
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const update = {
        editFormField: {
          action: { name: 'REORDER' },
          field: expected[0],
        },
      } as FormUpdateParams

      // Act
      const actualPromise = updateForm(MOCK_FORM_ID, update)
      MockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.put).toHaveBeenCalledWith(`${MOCK_FORM_ID}/adminform`, {
        form: update,
      })
    })

    it('should reject with error message if PUT request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const update = {
        editFormField: {
          action: { name: 'REORDER' },
          field: {} as IYesNoFieldSchema,
        },
      } as FormUpdateParams

      // Act
      const actualPromise = updateForm(MOCK_FORM_ID, update)
      MockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.put).toHaveBeenCalledWith(`${MOCK_FORM_ID}/adminform`, {
        form: update,
      })
    })
  })

  describe('transferOwner', () => {
    it('should return updated form if POST request succeeds', async () => {
      // Arrange
      const MOCK_FORM_ID = 'mock-form-id'
      const expected = {
        _id: MOCK_FORM_ID,
      } as IPopulatedForm
      const MOCK_NEW_OWNER = 'test@open.gov.sg'
      // Act
      const actualPromise = transferOwner(MOCK_FORM_ID, MOCK_NEW_OWNER)
      MockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(
        MockAxios.post,
      ).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/collaborators/transfer-owner`,
        { email: MOCK_NEW_OWNER },
      )
    })

    it('should reject with error message if POST request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = 'mock-form-id'
      const MOCK_NEW_OWNER = 'test@open.gov.sg'

      // Act
      const actualPromise = transferOwner(MOCK_FORM_ID, MOCK_NEW_OWNER)
      MockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(
        MockAxios.post,
      ).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/collaborators/transfer-owner`,
        { email: MOCK_NEW_OWNER },
      )
    })
  })
})
