import MockAxios from 'jest-mock-axios'

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
})
