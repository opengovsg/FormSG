import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import mockAxios from 'jest-mock-axios'

import { FormUpdateParams } from 'src/app/modules/form/admin-form/admin-form.types'
import { IFieldSchema, IPopulatedUser, IYesNoFieldSchema } from 'src/types'
import {
  FormMetaView,
  IPopulatedForm,
  PublicForm,
  ResponseMode,
} from 'src/types/form'

import {
  ADMIN_FORM_ENDPOINT,
  createForm,
  deleteForm,
  getAdminForm,
  getPublicForm,
  previewForm,
  PUBLIC_FORM_ENDPOINT,
  queryForm,
  queryTemplate,
  saveForm,
  transferOwner,
  updateForm,
  useTemplate,
} from '../FormService'

jest.mock('axios', () => mockAxios)

const MOCK_USER = {
  _id: new ObjectId(),
} as IPopulatedUser

describe('FormService', () => {
  afterEach(() => mockAxios.reset())
  const MOCK_INTERCEPTOR = {
    response: (response: AxiosResponse) => response,
    request: (config: AxiosRequestConfig) => config,
    responseError: null,
  }
  describe('queryForm', () => {
    it('should successfully return all available forms if GET request succeeds', async () => {
      // Arrange
      const expected: FormMetaView[] = [_generateMockDashboardViewForm()]

      // Act
      const actualPromise = queryForm(MOCK_INTERCEPTOR)
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`, {
        headers: { 'If-Modified-Since': '0' },
      })
    })

    it('should successfully return empty array if GET request succeeds and there are no forms', async () => {
      // Arrange
      const expected: FormMetaView[] = []

      // Act
      const actualPromise = queryForm(MOCK_INTERCEPTOR)
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`, {
        headers: { 'If-Modified-Since': '0' },
      })
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const expected = new Error('error')

      // Act
      const actualPromise = queryForm(MOCK_INTERCEPTOR)
      mockAxios.mockError(expected)

      //Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`, {
        headers: { 'If-Modified-Since': '0' },
      })
    })
  })

  describe('getAdminForm', () => {
    it('should return admin form if GET request succeeds', async () => {
      // Arrange
      const expected = _generateMockFullForm()
      const accessMode = 'adminform'

      // Act
      const actualPromise = getAdminForm(
        expected._id,
        MOCK_INTERCEPTOR,
        accessMode,
      )
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `/${expected._id}/${accessMode}`,
        {
          headers: { 'If-Modified-Since': '0' },
        },
      )
    })

    it('should reject with error message when GET request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM = _generateMockFullForm()
      const accessMode = 'adminform'

      // Act
      const actualPromise = getAdminForm(
        MOCK_FORM._id,
        MOCK_INTERCEPTOR,
        accessMode,
      )
      mockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `/${MOCK_FORM._id}/${accessMode}`,
        {
          headers: { 'If-Modified-Since': '0' },
        },
      )
    })
  })

  describe('getPublicForm', () => {
    it('should return public form if GET request succeeds', async () => {
      // Arrange
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const expected = {
        form: { _id: MOCK_FORM_ID, form_fields: [] },
        spcpSession: { username: 'username' },
        isIntranetUser: false,
        myInfoError: true,
      }

      // Act
      const actualPromise = getPublicForm(MOCK_FORM_ID, MOCK_INTERCEPTOR)
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${PUBLIC_FORM_ENDPOINT}/${MOCK_FORM_ID}`,
        {
          headers: { 'If-Modified-Since': '0' },
        },
      )
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const expected = new Error('error')

      // Act
      const actualPromise = getPublicForm(MOCK_FORM_ID, MOCK_INTERCEPTOR)
      mockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${PUBLIC_FORM_ENDPOINT}/${MOCK_FORM_ID}`,
        {
          headers: { 'If-Modified-Since': '0' },
        },
      )
    })
  })

  describe('updateForm', () => {
    it('should return updated form if PUT request succeeds', async () => {
      // Arrange
      const expected = [_generateMockField()]
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const update = {
        form: {
          editFormField: {
            action: { name: 'REORDER' },
            field: expected[0],
          },
        } as FormUpdateParams,
      }
      const accessMode = 'adminform'

      // Act
      const actualPromise = updateForm(
        MOCK_FORM_ID,
        update,
        MOCK_INTERCEPTOR,
        accessMode,
      )
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.put).toHaveBeenCalledWith(
        `${MOCK_FORM_ID}/${accessMode}`,
        update,
      )
    })

    it('should reject with error message if PUT request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const update = {
        form: {
          editFormField: {
            action: { name: 'REORDER' },
            field: _generateMockField(),
          },
        } as FormUpdateParams,
      }
      const accessMode = 'adminform'

      // Act
      const actualPromise = updateForm(MOCK_FORM_ID, update, MOCK_INTERCEPTOR)
      mockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.put).toHaveBeenCalledWith(
        `${MOCK_FORM_ID}/${accessMode}`,
        update,
      )
    })

    describe('saveForm', () => {
      it('should return saved form if POST request succeeds', async () => {
        // Arrange
        const expected = _generateMockDashboardViewForm()
        const MOCK_FORM_ID = expected._id
        const MOCK_FIELDS = [_generateMockField()]

        // Act
        const actualPromise = saveForm(
          MOCK_FORM_ID,
          MOCK_FIELDS,
          MOCK_INTERCEPTOR,
        )
        mockAxios.mockResponse({ data: expected })
        const actual = await actualPromise

        // Assert
        expect(actual).toEqual(expected)
        expect(mockAxios.post).toHaveBeenCalledWith(
          `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/duplicate`,
          MOCK_FIELDS,
        )
      })

      it('should reject with error message if POST request fails', async () => {
        // Arrange
        const expected = new Error('error')
        const MOCK_FORM_ID = new ObjectId().toHexString()
        const MOCK_FIELDS = [_generateMockField()]

        // Act
        const actualPromise = saveForm(
          MOCK_FORM_ID,
          MOCK_FIELDS,
          MOCK_INTERCEPTOR,
        )
        mockAxios.mockError(expected)

        // Assert
        await expect(actualPromise).rejects.toEqual(expected)
        expect(mockAxios.post).toHaveBeenCalledWith(
          `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/duplicate`,
          MOCK_FIELDS,
        )
      })
    })
  })

  describe('deleteForm', () => {
    it('should successfully call delete endpoint', async () => {
      // Arrange
      const MOCK_FORM_ID = new ObjectId().toHexString()

      // Act
      const actualPromise = deleteForm(MOCK_FORM_ID, MOCK_INTERCEPTOR)
      mockAxios.mockResponse({
        status: StatusCodes.OK,
        data: { message: 'Form has been archived' },
      })
      await actualPromise

      // Assert
      expect(mockAxios.delete).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}`,
      )
    })

    it('should reject with error message if DELETE request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()

      // Act
      const actualPromise = deleteForm(MOCK_FORM_ID, MOCK_INTERCEPTOR)
      mockAxios.mockError(expected)

      await expect(actualPromise).rejects.toEqual(expected)
      // Assert
      expect(mockAxios.delete).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}`,
      )
    })
  })

  describe('createForm', () => {
    it('should return created form if POST request succeeds', async () => {
      // Arrange
      const expected = { form_fields: [_generateMockField()] }
      const MOCK_FORM_PARAMS = { form: [_generateMockField()] }

      // Act
      const actualPromise = createForm(MOCK_FORM_PARAMS, MOCK_INTERCEPTOR)
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}`,
        MOCK_FORM_PARAMS,
      )
    })

    it('should reject with error message if POST request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_PARAMS = { form: [_generateMockField()] }

      // Act
      const actualPromise = createForm(MOCK_FORM_PARAMS, MOCK_INTERCEPTOR)
      mockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}`,
        MOCK_FORM_PARAMS,
      )
    })
  })

  describe('queryTemplate', () => {
    it('should return template if GET request succeeds', async () => {
      // Arrange
      const expected = _generateMockPublicForm()
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const accessMode = 'adminform'

      // Act
      const actualPromise = queryTemplate(
        MOCK_FORM_ID,
        MOCK_INTERCEPTOR,
        accessMode,
      )
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/${accessMode}/template`,
      )
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const accessMode = 'adminform'

      // Act
      const actualPromise = queryTemplate(
        MOCK_FORM_ID,
        MOCK_INTERCEPTOR,
        accessMode,
      )
      mockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/${accessMode}/template`,
      )
    })
  })

  describe('previewForm', () => {
    it('should return public form if GET request succeeds', async () => {
      // Arrange
      const expected = _generateMockPublicForm()
      const MOCK_FORM_ID = new ObjectId().toHexString()

      // Act
      const actualPromise = previewForm(MOCK_FORM_ID, MOCK_INTERCEPTOR)
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/preview`,
      )
    })

    it('should reject with error message if GET request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()

      // Act
      const actualPromise = previewForm(MOCK_FORM_ID, MOCK_INTERCEPTOR)
      mockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.get).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/preview`,
      )
    })
  })

  describe('useTemplate', () => {
    it('should return template if POST request succeeds', async () => {
      // Arrange
      const expected = _generateMockDashboardViewForm()
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const accessMode = 'adminform'

      // Act
      const actualPromise = useTemplate(
        MOCK_FORM_ID,
        MOCK_INTERCEPTOR,
        accessMode,
      )
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/${accessMode}/copy`,
      )
    })

    it('should reject with error message if POST request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const accessMode = 'adminform'

      // Act
      const actualPromise = useTemplate(
        MOCK_FORM_ID,
        MOCK_INTERCEPTOR,
        accessMode,
      )
      mockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/${accessMode}/copy`,
      )
    })
  })

  describe('transferOwner', () => {
    it('should return updated form if POST request succeeds', async () => {
      // Arrange
      const expected = _generateMockFullForm()
      const MOCK_FORM_ID = new ObjectId().toHexString()

      // Act
      const actualPromise = transferOwner(MOCK_FORM_ID, MOCK_INTERCEPTOR)
      mockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/collaborators/transfer-owner`,
      )
    })

    it('should reject with error message if POST request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()

      // Act
      const actualPromise = transferOwner(MOCK_FORM_ID, MOCK_INTERCEPTOR)
      mockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(mockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/collaborators/transfer-owner`,
      )
    })
  })
})

// Utils
const _generateMockDashboardViewForm = (): FormMetaView => {
  return {
    title: 'title',
    lastModified: new Date(),
    _id: new ObjectId(),
    responseMode: ResponseMode.Email,
    admin: MOCK_USER,
  }
}

const _generateMockFullForm = (): IPopulatedForm => {
  return {
    _id: new ObjectId(),
  } as IPopulatedForm
}

const _generateMockField = (): IFieldSchema => {
  return {} as IYesNoFieldSchema
}

const _generateMockPublicForm = (): PublicForm => {
  return ({
    _id: new ObjectId(),
    title: 'mock preview title',
    admin: MOCK_USER,
  } as unknown) as PublicForm
}
