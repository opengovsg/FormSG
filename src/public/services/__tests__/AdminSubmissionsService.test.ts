import axios from 'axios'
import { mocked } from 'ts-jest/utils'

import { SubmissionMetadataList } from 'src/types'

import { ADMIN_FORM_ENDPOINT } from '../AdminFormService'
import {
  countFormSubmissions,
  getEncryptedResponse,
  getSubmissionMetadataById,
  getSubmissionsMetadataByPage,
} from '../AdminSubmissionsService'

jest.mock('axios')
const MockAxios = mocked(axios, true)

describe('AdminSubmissionsService', () => {
  describe('countFormSubmissions', () => {
    const MOCK_FORM_ID = 'mock–form-id'
    const MOCK_START_DATE = new Date(2020, 11, 17)
    const MOCK_END_DATE = new Date(2021, 1, 10)

    it('should call api successfully when all parameters are provided', async () => {
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: 123 })

      // Act
      const actual = await countFormSubmissions({
        formId: MOCK_FORM_ID,
        dates: { startDate: MOCK_START_DATE, endDate: MOCK_END_DATE },
      })

      // Assert
      expect(actual).toEqual(123)
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
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: 123 })

      // Act
      const actual = await countFormSubmissions({
        formId: MOCK_FORM_ID,
      })

      // Assert
      expect(actual).toEqual(123)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/submissions/count`,
      )
    })
  })

  describe('getSubmissionsMetadataByPage', () => {
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
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: MOCK_RESPONSE })

      // Act
      const actual = await getSubmissionsMetadataByPage({
        formId: MOCK_FORM_ID,
        pageNum: MOCK_PAGE_NUM,
      })

      // Assert
      expect(actual).toEqual(MOCK_RESPONSE)
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

  describe('getSubmissionMetadataById', () => {
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
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: MOCK_RESPONSE })

      // Act
      const actual = await getSubmissionMetadataById({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })

      // Assert
      expect(actual).toEqual(MOCK_RESPONSE)
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
      // Arrange
      MockAxios.get.mockResolvedValueOnce({ data: MOCK_RESPONSE })

      // Act
      const actual = await getEncryptedResponse({
        formId: MOCK_FORM_ID,
        submissionId: MOCK_SUBMISSION_ID,
      })

      // Assert
      expect(actual).toEqual(MOCK_RESPONSE)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/submissions/${MOCK_SUBMISSION_ID}`,
      )
    })
  })
})
