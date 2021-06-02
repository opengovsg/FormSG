import { ObjectId } from 'bson'
import { StatusCodes } from 'http-status-codes'
import MockAxios from 'jest-mock-axios'

import { DuplicateFormBody } from 'src/app/modules/form/admin-form/admin-form.types'
import { IPopulatedUser, IYesNoFieldSchema } from 'src/types'
import { ResponseMode } from 'src/types/form'

import {
  ADMIN_FORM_ENDPOINT,
  createForm,
  deleteForm,
  duplicateForm,
} from '../CreateFormService'

jest.mock('axios', () => MockAxios)

const MOCK_USER = {
  _id: new ObjectId(),
} as IPopulatedUser

describe('CreateFormService', () => {
  afterEach(() => MockAxios.reset())
  describe('duplicateForm', () => {
    it('should return saved form if POST request succeeds', async () => {
      // Arrange
      const expected = {
        title: 'title',
        lastModified: new Date(),
        _id: new ObjectId().toHexString(),
        responseMode: ResponseMode.Email,
        admin: MOCK_USER,
      }
      const MOCK_FORM_ID = expected._id
      const MOCK_DUPLICATE_FORM_BODY = _generateDuplicateFormBody()

      // Act
      const actualPromise = duplicateForm(
        MOCK_FORM_ID,
        MOCK_DUPLICATE_FORM_BODY,
      )
      MockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/duplicate`,
        MOCK_DUPLICATE_FORM_BODY,
      )
    })

    it('should reject with error message if POST request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()
      const MOCK_DUPLICATE_FORM_BODY = _generateDuplicateFormBody()

      // Act
      const actualPromise = duplicateForm(
        MOCK_FORM_ID,
        MOCK_DUPLICATE_FORM_BODY,
      )
      MockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/duplicate`,
        MOCK_DUPLICATE_FORM_BODY,
      )
    })
  })

  describe('deleteForm', () => {
    it('should successfully call delete endpoint', async () => {
      // Arrange
      const MOCK_FORM_ID = new ObjectId().toHexString()

      // Act
      const actualPromise = deleteForm(MOCK_FORM_ID)
      MockAxios.mockResponse({
        status: StatusCodes.OK,
        data: { message: 'Form has been archived' },
      })
      await actualPromise

      // Assert
      expect(MockAxios.delete).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}`,
      )
    })

    it('should reject with error message if DELETE request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_ID = new ObjectId().toHexString()

      // Act
      const actualPromise = deleteForm(MOCK_FORM_ID)
      MockAxios.mockError(expected)

      await expect(actualPromise).rejects.toEqual(expected)
      // Assert
      expect(MockAxios.delete).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}`,
      )
    })
  })

  describe('createForm', () => {
    it('should return created form if POST request succeeds', async () => {
      // Arrange
      const expected = { form_fields: [{} as IYesNoFieldSchema] }
      const MOCK_FORM_PARAMS = {
        title: 'title',
        responseMode: ResponseMode.Email,
      }
      // Act
      const actualPromise = createForm(MOCK_FORM_PARAMS)
      MockAxios.mockResponse({ data: expected })
      const actual = await actualPromise

      // Assert
      expect(actual).toEqual(expected)
      expect(MockAxios.post).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`, {
        form: MOCK_FORM_PARAMS,
      })
    })

    it('should reject with error message if POST request fails', async () => {
      // Arrange
      const expected = new Error('error')
      const MOCK_FORM_PARAMS = {
        title: 'title',
        responseMode: ResponseMode.Email,
      }

      // Act
      const actualPromise = createForm(MOCK_FORM_PARAMS)
      MockAxios.mockError(expected)

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.post).toHaveBeenCalledWith(`${ADMIN_FORM_ENDPOINT}`, {
        form: MOCK_FORM_PARAMS,
      })
    })
  })
})

const _generateDuplicateFormBody = (): DuplicateFormBody => {
  return {
    title: 'title',
    responseMode: ResponseMode.Email,
    emails: 'test@example.com',
  } as DuplicateFormBody
}
