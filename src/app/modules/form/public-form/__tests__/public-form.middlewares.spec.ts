import { ObjectId } from 'bson-ext'
import { Request } from 'express'
import { StatusCodes } from 'http-status-codes'
import { merge, times } from 'lodash'
import mongoose from 'mongoose'

import expressHandler from 'tests/unit/backend/helpers/jest-express'

import dbHandler from '../../../../../../tests/unit/backend/helpers/jest-db'
import {
  IEncryptedSubmissionSchema,
  ResponseMode,
  Status,
  SubmissionType,
  WithForm,
} from '../../../../../types'
import getFormModel from '../../../../models/form.server.model'
import getSubmissionModel from '../../../../models/submission.server.model'
import {
  checkFormSubmissionLimitAndDeactivate,
  isFormPublicCheck,
} from '../public-form.middlewares'

const FormModel = getFormModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)

const MOCK_ADMIN_OBJ_ID = new ObjectId()

const MOCK_FORM_PARAMS = {
  title: 'Test Form',
  admin: String(MOCK_ADMIN_OBJ_ID),
}
const MOCK_ENCRYPTED_FORM_PARAMS = {
  ...MOCK_FORM_PARAMS,
  publicKey: 'mockPublicKey',
  responseMode: ResponseMode.Encrypt,
}

describe('public-form.middlewares', () => {
  describe('checkFormSubmissionLimitAndDeactivate', () => {
    beforeAll(async () => await dbHandler.connect())
    beforeEach(async () => {
      await dbHandler.insertFormCollectionReqs({
        userId: MOCK_ADMIN_OBJ_ID,
      })
    })
    afterEach(async () => await dbHandler.clearDatabase())
    afterAll(async () => await dbHandler.closeDatabase())

    it('should let requests through when form has no submission limit', async () => {
      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form: { submissionLimit: null },
      }) as WithForm<Request>
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      await checkFormSubmissionLimitAndDeactivate(mockReq, mockRes, mockNext)

      expect(mockNext).toBeCalled()
      expect(mockRes.sendStatus).not.toBeCalled()
      expect(mockRes.status).not.toBeCalled()
      expect(mockRes.json).not.toBeCalled()
    })

    it('should let requests through when form has not reached submission limit', async () => {
      const formParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
        status: Status.Public,
        submissionLimit: 10,
      })
      const validForm = new FormModel(formParams)
      const form = await validForm.save()

      const submissionPromises = times(5, () =>
        SubmissionModel.create<IEncryptedSubmissionSchema>({
          form: form._id,
          myInfoFields: [],
          submissionType: SubmissionType.Encrypt,
          encryptedContent: 'mockEncryptedContent',
          version: 1,
          created: new Date('2020-01-01'),
        }),
      )
      await Promise.all(submissionPromises)

      const title = 'My private form'
      const inactiveMessage = 'The form is not available.'

      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form: {
          _id: form._id.toHexString(),
          submissionLimit: 10,
          title,
          inactiveMessage,
        },
      }) as WithForm<Request>
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      await checkFormSubmissionLimitAndDeactivate(mockReq, mockRes, mockNext)

      expect(mockNext).toBeCalled()
      expect(mockRes.sendStatus).not.toBeCalled()
      expect(mockRes.status).not.toBeCalled()
      expect(mockRes.json).not.toBeCalled()
    })

    it('should not let requests through and deactivate form when form has reached submission limit', async () => {
      const formParams = merge({}, MOCK_ENCRYPTED_FORM_PARAMS, {
        status: Status.Public,
        submissionLimit: 5,
      })
      const validForm = new FormModel(formParams)
      const form = await validForm.save()

      const submissionPromises = times(5, () =>
        SubmissionModel.create<IEncryptedSubmissionSchema>({
          form: form._id,
          myInfoFields: [],
          submissionType: SubmissionType.Encrypt,
          encryptedContent: 'mockEncryptedContent',
          version: 1,
          created: new Date('2020-01-01'),
        }),
      )
      await Promise.all(submissionPromises)

      const title = 'My private form'
      const inactiveMessage = 'The form is not available.'

      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form: {
          _id: form._id.toHexString(),
          submissionLimit: 5,
          title,
          inactiveMessage,
        },
      }) as WithForm<Request>
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      await checkFormSubmissionLimitAndDeactivate(mockReq, mockRes, mockNext)

      expect(mockNext).not.toBeCalled()
      expect(mockRes.json).toBeCalledWith({
        message: inactiveMessage,
        isPageFound: true,
        formTitle: title,
      })
      expect(mockRes.status).toBeCalledWith(StatusCodes.NOT_FOUND)

      const updated = await FormModel.findById(form._id)
      expect(updated!.status).toBe('PRIVATE')
    })
  })

  describe('isFormPublicCheck', () => {
    it('should call next middleware function if form is public', () => {
      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form: { status: Status.Public },
      }) as WithForm<Request>
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      isFormPublicCheck(mockReq, mockRes, mockNext)

      expect(mockNext).toBeCalled()
      expect(mockRes.sendStatus).not.toBeCalled()
      expect(mockRes.status).not.toBeCalled()
      expect(mockRes.json).not.toBeCalled()
    })

    it('should return HTTP 404 Not Found if form is private', () => {
      const title = 'My private form'
      const inactiveMessage = 'The form is not available.'
      const form = {
        status: Status.Private,
        title,
        inactiveMessage,
      }

      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form,
      }) as WithForm<Request>
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      isFormPublicCheck(mockReq, mockRes, mockNext)

      expect(mockNext).not.toBeCalled()
      expect(mockRes.sendStatus).not.toBeCalled()
      expect(mockRes.status).toBeCalledWith(StatusCodes.NOT_FOUND)
      expect(mockRes.json).toBeCalledWith({
        message: inactiveMessage,
        isPageFound: true,
        formTitle: title,
      })
    })

    it('should return HTTP 410 Gone if form is archived', () => {
      const form = {
        status: Status.Archived,
      }

      const mockReq = Object.assign(expressHandler.mockRequest(), {
        form,
      }) as WithForm<Request>
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      isFormPublicCheck(mockReq, mockRes, mockNext)

      expect(mockNext).not.toBeCalled()
      expect(mockRes.sendStatus).toBeCalledWith(StatusCodes.GONE)
      expect(mockRes.status).not.toBeCalled()
      expect(mockRes.json).not.toBeCalledWith()
    })
  })
})
