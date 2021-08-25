import MockAxios from 'jest-mock-axios'

import {
  AdminDashboardFormMetaDto,
  AdminFormViewDto,
  DateString,
  FormId,
  FormResponseMode,
  FormStatus,
  PreviewFormViewDto,
  UserDto,
} from '../../../../shared/types'
import {
  ADMIN_FORM_ENDPOINT,
  getAdminFormView,
  getDashboardView,
  previewForm,
} from '../AdminViewFormService'

jest.mock('axios', () => MockAxios)

const MOCK_USER = {
  _id: 'mock-user-id',
} as UserDto

describe('AdminViewFormService', () => {
  afterEach(() => MockAxios.reset())
  describe('getDashboardView', () => {
    it('should successfully return all available forms if GET request succeeds', async () => {
      // Arrange
      const expected: AdminDashboardFormMetaDto[] = [
        {
          title: 'title',
          lastModified: new Date().toISOString() as DateString,
          _id: 'mock-form-id' as FormId,
          responseMode: FormResponseMode.Email,
          admin: MOCK_USER,
          status: FormStatus.Private,
        },
      ]
      MockAxios.get.mockResolvedValueOnce({ data: expected })
      // Act
      const actual = await getDashboardView()

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`)
    })

    it('should successfully return empty array if GET request succeeds and there are no forms', async () => {
      // Arrange
      const mockResponse: AdminDashboardFormMetaDto[] = []
      MockAxios.get.mockResolvedValueOnce({ data: mockResponse })

      // Act
      const actual = await getDashboardView()

      // Assert
      expect(actual).toEqual(mockResponse)
      expect(MockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`)
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const mockError = new Error('error')
      MockAxios.get.mockRejectedValueOnce(mockError)

      // Act
      const actualPromise = getDashboardView()

      //Assert
      await expect(actualPromise).rejects.toEqual(mockError)
      expect(MockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`)
    })
  })

  describe('getAdminFormView', () => {
    it('should return admin form if GET request succeeds', async () => {
      // Arrange
      const mockResponse = _generateMockFullForm()
      MockAxios.get.mockResolvedValueOnce({ data: mockResponse })

      // Act
      const actual = await getAdminFormView(mockResponse.form._id)

      // Assert
      expect(actual).toEqual(mockResponse)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${mockResponse.form._id}`,
      )
    })

    it('should reject with error message when GET request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const mockForm = _generateMockFullForm().form
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = getAdminFormView(mockForm._id)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${mockForm._id}`,
      )
    })
  })

  describe('previewForm', () => {
    const MOCK_FORM_ID = 'mock-form-id'

    it('should return form preview if GET request succeeds', async () => {
      // Arrange
      const expected = {
        _id: MOCK_FORM_ID,
        title: 'mock preview title',
        admin: MOCK_USER,
      } as unknown as PreviewFormViewDto
      MockAxios.get.mockResolvedValueOnce({ data: expected })

      // Act
      const actual = await previewForm(MOCK_FORM_ID)

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/preview`,
      )
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const expected = new Error('error')
      MockAxios.get.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = previewForm(MOCK_FORM_ID)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/preview`,
      )
    })
  })
})

// Utils
const _generateMockFullForm = (): AdminFormViewDto => {
  return {
    form: {
      _id: 'mock-form-id',
    },
  } as AdminFormViewDto
}
