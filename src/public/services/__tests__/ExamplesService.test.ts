import MockAxios from 'jest-mock-axios'

import {
  DuplicateFormBodyDto,
  FormResponseMode,
  PublicFormViewDto,
  UserDto,
} from '../../../../shared/types'
import * as ExamplesService from '../ExamplesService'

jest.mock('axios', () => MockAxios)

describe('ExamplesService', () => {
  afterEach(() => jest.clearAllMocks())
  describe('getExampleForms', () => {
    const MOCK_PARAMS = {
      pageNo: 1,
      searchTerm: 'mock',
      agency: 'Mock Gov',
      shouldGetTotalNumResults: false,
    }
    const MOCK_HEADERS = { 'If-Modified-Since': '0' }
    it('should return example forms data when the GET request succeeds', async () => {
      // Arrange
      const expected = {}
      MockAxios.get.mockResolvedValueOnce({ data: {} })

      // Act
      const actual = await ExamplesService.getExampleForms(MOCK_PARAMS)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        ExamplesService.EXAMPLES_ENDPOINT,
        {
          params: MOCK_PARAMS,
          headers: MOCK_HEADERS,
        },
      )
      expect(actual).toEqual(expected)
    })

    it('should reject with the provided error message when the GET request fails', async () => {
      // Arrange
      const expected = new Error('Mock Error')
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = ExamplesService.getExampleForms(MOCK_PARAMS)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        ExamplesService.EXAMPLES_ENDPOINT,
        {
          params: MOCK_PARAMS,
          headers: MOCK_HEADERS,
        },
      )
    })
  })

  describe('getSingleExampleForm', () => {
    const MOCK_FORM_ID = 'MOCK'
    const MOCK_HEADERS = { 'If-Modified-Since': '0' }
    it('should return example single form data when the GET request succeeds', async () => {
      // Arrange
      const expected = {}
      const expectedMockEndpoint = `${ExamplesService.EXAMPLES_ENDPOINT}/${MOCK_FORM_ID}`
      MockAxios.get.mockResolvedValueOnce({ data: {} })

      // Act
      const actual = await ExamplesService.getSingleExampleForm(MOCK_FORM_ID)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(expectedMockEndpoint, {
        headers: MOCK_HEADERS,
      })
      expect(actual).toEqual(expected)
    })

    it('should reject with the provided error message when the GET request fails', async () => {
      // Arrange
      const expected = new Error('Mock Error')
      const expectedMockEndpoint = `${ExamplesService.EXAMPLES_ENDPOINT}/${MOCK_FORM_ID}`
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = ExamplesService.getSingleExampleForm(MOCK_FORM_ID)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(expectedMockEndpoint, {
        headers: MOCK_HEADERS,
      })
    })
  })

  describe('useTemplate', () => {
    it('should return template if POST request succeeds', async () => {
      // Arrange
      const MOCK_USER = {
        _id: 'mock-user-id',
      } as UserDto
      const MOCK_FORM_ID = 'mock-form-id'
      const expected = {
        title: 'title',
        lastModified: new Date(),
        _id: MOCK_FORM_ID,
        responseMode: FormResponseMode.Email,
        admin: MOCK_USER,
      }
      const MOCK_DUPLICATE_FORM_BODY = _generateDuplicateFormBody()
      MockAxios.post.mockResolvedValueOnce({ data: expected })

      // Act
      const actual = await ExamplesService.useTemplate(
        MOCK_FORM_ID,
        MOCK_DUPLICATE_FORM_BODY,
      )

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `${MOCK_FORM_ID}/adminform/copy`,
        MOCK_DUPLICATE_FORM_BODY,
      )
    })

    it('should reject with error message if POST request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = 'mock-form-id'
      const MOCK_DUPLICATE_FORM_BODY = _generateDuplicateFormBody()
      MockAxios.post.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = ExamplesService.useTemplate(
        MOCK_FORM_ID,
        MOCK_DUPLICATE_FORM_BODY,
      )

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `${MOCK_FORM_ID}/adminform/copy`,
        MOCK_DUPLICATE_FORM_BODY,
      )
    })
  })

  describe('queryTemplate', () => {
    it('should return template if GET request succeeds', async () => {
      // Arrange
      const MOCK_USER = {
        _id: 'mock-user-id',
      } as UserDto
      const MOCK_FORM_ID = 'mock-form-id'
      const expected = {
        _id: MOCK_FORM_ID,
        title: 'mock preview title',
        admin: MOCK_USER,
      } as unknown as PublicFormViewDto
      MockAxios.get.mockResolvedValueOnce({ data: expected })

      // Act
      const actual = await ExamplesService.queryTemplate(MOCK_FORM_ID)

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${MOCK_FORM_ID}/adminform/template`,
      )
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = 'mock-form-id'
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = ExamplesService.queryTemplate(MOCK_FORM_ID)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${MOCK_FORM_ID}/adminform/template`,
      )
    })
  })
})

// Utils
const _generateDuplicateFormBody = (): DuplicateFormBodyDto => {
  return {
    title: 'title',
    responseMode: FormResponseMode.Email,
    emails: 'test@example.com',
  } as DuplicateFormBodyDto
}
