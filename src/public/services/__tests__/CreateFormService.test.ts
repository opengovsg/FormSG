import { ObjectId } from 'bson'
import MockAxios from 'jest-mock-axios'

import { IPopulatedUser, IYesNoFieldSchema } from '../../../types'
import { DuplicateFormBody } from '../../../types/api'
import { ResponseMode } from '../../../types/form'
import {
  ADMIN_FORM_ENDPOINT,
  createForm,
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
      MockAxios.post.mockResolvedValueOnce({ data: expected })

      // Act
      const actual = await duplicateForm(MOCK_FORM_ID, MOCK_DUPLICATE_FORM_BODY)

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
      MockAxios.post.mockRejectedValueOnce(expected)

      // Act
      const actualPromise = duplicateForm(
        MOCK_FORM_ID,
        MOCK_DUPLICATE_FORM_BODY,
      )

      // Assert
      await expect(actualPromise).rejects.toEqual(expected)
      expect(MockAxios.post).toHaveBeenCalledWith(
        `${ADMIN_FORM_ENDPOINT}/${MOCK_FORM_ID}/duplicate`,
        MOCK_DUPLICATE_FORM_BODY,
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
      MockAxios.post.mockResolvedValueOnce({ data: expected })

      // Act
      const actual = await createForm(MOCK_FORM_PARAMS)

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
      MockAxios.post.mockRejectedValueOnce(expected)
      // Act
      const actualPromise = createForm(MOCK_FORM_PARAMS)

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
