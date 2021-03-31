import MockAxios from 'jest-mock-axios'

import * as ExampleService from '../ExampleService'

jest.mock('axios', () => MockAxios)

describe('ExampleService', () => {
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
      const actual = await ExampleService.getExampleForms(
        MOCK_PARAMS.pageNo,
        MOCK_PARAMS.searchTerm,
        MOCK_PARAMS.agency,
        MOCK_PARAMS.shouldGetTotalNumResults,
      )

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        ExampleService.EXAMPLES_ENDPOINT,
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
      const shouldReject = () =>
        ExampleService.getExampleForms(
          MOCK_PARAMS.pageNo,
          MOCK_PARAMS.searchTerm,
          MOCK_PARAMS.agency,
          MOCK_PARAMS.shouldGetTotalNumResults,
        )
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      await expect(shouldReject).rejects.toEqual(expected)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(
        ExampleService.EXAMPLES_ENDPOINT,
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
      const expectedMockEndpoint = `${ExampleService.EXAMPLES_ENDPOINT}/${MOCK_FORM_ID}`
      MockAxios.get.mockResolvedValueOnce({ data: {} })

      // Act
      const actual = await ExampleService.getSingleExampleForm(MOCK_FORM_ID)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(expectedMockEndpoint, {
        headers: MOCK_HEADERS,
      })
      expect(actual).toEqual(expected)
    })

    it('should reject with the provided error message when the GET request fails', async () => {
      // Arrange
      const expected = new Error('Mock Error')
      const expectedMockEndpoint = `${ExampleService.EXAMPLES_ENDPOINT}/${MOCK_FORM_ID}`
      const shouldReject = () =>
        ExampleService.getSingleExampleForm(MOCK_FORM_ID)
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      await expect(shouldReject).rejects.toEqual(expected)

      // Assert
      expect(MockAxios.get).toHaveBeenCalledWith(expectedMockEndpoint, {
        headers: MOCK_HEADERS,
      })
    })
  })
})
