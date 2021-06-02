import MockAxios from 'jest-mock-axios'

import { IPopulatedUser } from 'src/types'
import {
  FormMetaView,
  IPopulatedForm,
  PublicForm,
  ResponseMode,
} from 'src/types/form'

import {
  ADMIN_FORM_ENDPOINT,
  getAdminFormView,
  getDashboardView,
  previewForm,
} from '../AdminViewFormService'

jest.mock('axios', () => MockAxios)

const MOCK_USER = {
  _id: 'mock-user-id',
} as IPopulatedUser

describe('AdminViewFormService', () => {
  afterEach(() => MockAxios.reset())
  describe('getDashboardView', () => {
    it('should successfully return all available forms if GET request succeeds', async () => {
      // Arrange
      const expected: FormMetaView[] = [
        {
          title: 'title',
          lastModified: new Date(),
          _id: 'mock-form-id',
          responseMode: ResponseMode.Email,
          admin: MOCK_USER,
        },
      ]

      // Act
      const actualPromise = getDashboardView()
      MockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`)
    })

    it('should successfully return empty array if GET request succeeds and there are no forms', async () => {
      // Arrange
      const expected: FormMetaView[] = []

      // Act
      const actualPromise = getDashboardView()
      MockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`)
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const expected = new Error('error')

      // Act
      const actualPromise = getDashboardView()
      MockAxios.mockError(expected)

      //Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`)
    })
  })

  describe('getAdminFormView', () => {
    it('should return admin form if GET request succeeds', async () => {
      // Arrange
      const expected = _generateMockFullForm()

      // Act
      const actualPromise = getAdminFormView(expected._id)
      MockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(`/${expected._id}/adminform`)
    })

    it('should reject with error message when GET request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM = _generateMockFullForm()

      // Act
      const actualPromise = getAdminFormView(MOCK_FORM._id)
      MockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(`/${MOCK_FORM._id}/adminform`)
    })
  })

  describe('previewForm', () => {
    it('should return public form if GET request succeeds', async () => {
      // Arrange
      const MOCK_FORM_ID = 'mock-form-id'
      const expected = ({
        _id: MOCK_FORM_ID,
        title: 'mock preview title',
        admin: MOCK_USER,
      } as unknown) as PublicForm

      // Act
      const actualPromise = previewForm(MOCK_FORM_ID)
      MockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/preview`,
      )
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = 'mock-form-id'

      // Act
      const actualPromise = previewForm(MOCK_FORM_ID)
      MockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/preview`,
      )
    })
  })
})

// Utils
const _generateMockFullForm = (): IPopulatedForm => {
  return {
    _id: 'mock-form-id',
  } as IPopulatedForm
}
