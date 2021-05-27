/* eslint-disable @typescript-eslint/ban-ts-comment */
import MockAxios from 'jest-mock-axios'

import { BasicField, SubmissionMetadataList } from 'src/types'
import {
  EmailSubmissionDto,
  EncryptSubmissionDto,
  SubmissionResponseDto,
} from 'src/types/api'

import * as SubmissionUtil from '../../utils/submission'
import {
  ADMIN_FORM_ENDPOINT,
  countFormSubmissions,
  getEncryptedResponse,
  getFormsMetadata,
  submitEmailModeFormPreview,
  submitStorageModeFormPreview,
} from '../AdminFormService'

jest.mock('axios', () => MockAxios)

describe('AdminFormService', () => {
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
      expect(
        MockAxios.post,
      ).toHaveBeenCalledWith(
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
      expect(
        MockAxios.post,
      ).toHaveBeenCalledWith(
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

  describe('countFormSubmissions', () => {
    const MOCK_FORM_ID = 'mock–form-id'
    const MOCK_START_DATE = new Date(2020, 11, 17)
    const MOCK_END_DATE = new Date(2021, 1, 10)

    it('should call api successfully when all parameters are provided', async () => {
      // Act
      const actual = countFormSubmissions({
        formId: MOCK_FORM_ID,
        startDate: MOCK_START_DATE,
        endDate: MOCK_END_DATE,
      })
      MockAxios.mockResponse({ data: 123 })

      // Assert
      await expect(actual).resolves.toEqual(123)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/submissions/count`,
        {
          params: {
            startDate: MOCK_START_DATE,
            endDate: MOCK_END_DATE,
          },
        },
      )
    })

    it('should call api successfully when only formId is provided', async () => {
      // Act
      const actual = countFormSubmissions({
        formId: MOCK_FORM_ID,
      })
      MockAxios.mockResponse({ data: 123 })

      // Assert
      await expect(actual).resolves.toEqual(123)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/submissions/count`,
      )
    })

    it('should call api successfully with only formId when startDate or endDate is provided', async () => {
      // Act
      const actual = countFormSubmissions({
        formId: MOCK_FORM_ID,
        startDate: MOCK_START_DATE,
      })
      MockAxios.mockResponse({ data: 123 })

      // Assert
      await expect(actual).resolves.toEqual(123)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/submissions/count`,
      )
    })
  })

  describe('getFormsMetadata', () => {
    const MOCK_FORM_ID = 'mock–form-id'
    const MOCK_SUBMISSION_ID = 'fake'
    const MOCK_PAGE_NUM = 1
    const MOCK_RESPONSE: SubmissionMetadataList = {
      count: 1,
      metadata: [
        {
          number: 1,
          refNo: '1234',
          submissionTime: 'sometime',
        },
      ],
    }
    it('should call the api with only submissionId when both parameters are provided', async () => {
      // Act
      const actual = getFormsMetadata({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
        pageNum: MOCK_PAGE_NUM,
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/submissions/metadata`,
        {
          params: {
            submissionId: MOCK_SUBMISSION_ID,
          },
        },
      )
    })

    it('should call the api correctly when a single parameter is provided', async () => {
      // Act
      const actual = getFormsMetadata({
        formId: MOCK_FORM_ID,
        pageNum: MOCK_PAGE_NUM,
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/submissions/metadata`,
        {
          params: {
            page: MOCK_PAGE_NUM,
          },
        },
      )
    })
  })

  describe('getEncryptedResponse', () => {
    const MOCK_FORM_ID = 'mock–form-id'
    const MOCK_SUBMISSION_ID = 'fake'
    const MOCK_RESPONSE = {
      refNo: '1',
      submissionTime: 'sometime',
      content: 'jk',
      verified: 'whups',
      attachmentMetadata: {},
    }

    it('should call the api correctly when the parameters are valid', async () => {
      // Act
      const actual = getEncryptedResponse({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })
      MockAxios.mockResponse({ data: MOCK_RESPONSE })

      // Assert
      await expect(actual).resolves.toEqual(MOCK_RESPONSE)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/submissions/${MOCK_SUBMISSION_ID}`,
      )
    })
  })
})
