/* eslint-disable @typescript-eslint/ban-ts-comment */
import MockAxios from 'jest-mock-axios'

import { SubmissionMetadataList } from 'src/types'

import { ADMIN_FORM_ENDPOINT } from '../AdminFormService'
import {
  countFormSubmissions,
  getEncryptedResponse,
  getFormMetadata,
  getFormsMetadata,
} from '../AdminSubmissionsService'

jest.mock('axios', () => MockAxios)

describe('AdminSubmissionsService', () => {
  describe('countFormSubmissions', () => {
    const MOCK_FORM_ID = 'mock–form-id'
    const MOCK_START_DATE = new Date(2020, 11, 17)
    const MOCK_END_DATE = new Date(2021, 1, 10)

    it('should call api successfully when all parameters are provided', async () => {
      // Act
      const actual = countFormSubmissions({
        formId: MOCK_FORM_ID,
        dates: { startDate: MOCK_START_DATE, endDate: MOCK_END_DATE },
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
  })

  describe('getFormsMetadata', () => {
    const MOCK_FORM_ID = 'mock–form-id'
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

    it('should call the api correctly', async () => {
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

  describe('getFormMetadata', () => {
    const MOCK_FORM_ID = 'mock–form-id'
    const MOCK_SUBMISSION_ID = 'fake'
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

    it('should call the api correctly', async () => {
      // Act
      const actual = getFormMetadata({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
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
