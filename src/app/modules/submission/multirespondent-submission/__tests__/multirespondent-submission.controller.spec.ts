import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { merge, omit } from 'lodash'
import { Types } from 'mongoose'
import { errAsync, ok, okAsync } from 'neverthrow'
import { FormAuthType } from 'shared/types'

import * as FormService from 'src/app/modules/form/form.service'
import { MailSendError } from 'src/app/services/mail/mail.errors'
import { IMultirespondentSubmissionSchema } from 'src/types'

import {
  AttachmentUploadError,
  InvalidWorkflowTypeError,
  SubmissionNotFoundError,
  SubmissionSaveError,
} from '../../submission.errors'
import {
  submitMultirespondentFormForTest,
  updateMultirespondentSubmissionForTest,
} from '../multirespondent-submission.controller'
import * as MultiRespondentSubmissionService from '../multirespondent-submission.service'

jest.mock('src/app/modules/datadog/datadog.utils')

jest.mock('src/app/modules/form/form.service')
const MockFormService = jest.mocked(FormService)
jest.mock(
  'src/app/modules/submission/multirespondent-submission/multirespondent-submission.service',
)
const MockMultiRespondentSubmissionService = jest.mocked(
  MultiRespondentSubmissionService,
)

const mockFormId = new ObjectId().toHexString()
const mockMrfForm = {
  _id: mockFormId,
  workflow: [],
}
const mockSubmissionId = new ObjectId().toHexString()
const mockMrfSubmission = {
  _id: mockSubmissionId,
} as IMultirespondentSubmissionSchema & { _id: Types.ObjectId }

describe('multiresponodent-submision.controller', () => {
  beforeEach(() => {
    MockFormService.isFormPublic = jest.fn().mockReturnValue(ok(true))
    MockFormService.checkFormSubmissionLimitAndDeactivateForm = jest
      .fn()
      .mockReturnValue(okAsync(mockMrfForm))

    MockMultiRespondentSubmissionService.createMultiRespondentFormSubmission =
      jest.fn().mockReturnValue(okAsync(mockMrfSubmission))
    MockMultiRespondentSubmissionService.updateMultiRespondentFormSubmission =
      jest.fn().mockReturnValue(okAsync(mockMrfSubmission))
    MockMultiRespondentSubmissionService.performMultiRespondentPostSubmissionCreateActions =
      jest.fn().mockReturnValue(okAsync(true))
    MockMultiRespondentSubmissionService.performMultiRespondentPostSubmissionUpdateActions =
      jest.fn().mockReturnValue(okAsync(true))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('submitMultirespondentForm', () => {
    it('returns 200 ok when form validation passes and invokes createMultiRespondentFormSubmission and performMultiRespondentPostSubmissionCreateActions', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 0,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitMultirespondentFormForTest(mockSubmitMrfReq, mockRes)

      // Assert
      // save submission is invoked with correct args
      expect(
        MockMultiRespondentSubmissionService.createMultiRespondentFormSubmission,
      ).toHaveBeenCalledOnce()
      expect(
        omit(
          MockMultiRespondentSubmissionService
            .createMultiRespondentFormSubmission.mock.calls[0][0],
          'logMeta',
        ),
      ).toEqual({
        encryptedPayload: mockSubmitMrfReq.formsg.encryptedPayload,
        form: mockSubmitMrfReq.formsg.formDef,
      })

      // Assert post save actions are invoked with correct args
      expect(
        MockMultiRespondentSubmissionService.performMultiRespondentPostSubmissionCreateActions,
      ).toHaveBeenCalledOnce()
      expect(
        omit(
          MockMultiRespondentSubmissionService
            .performMultiRespondentPostSubmissionCreateActions.mock.calls[0][0],
          'logMeta',
        ),
      ).toEqual({
        form: mockSubmitMrfReq.formsg.formDef,
        encryptedPayload: mockSubmitMrfReq.formsg.encryptedPayload,
        submissionId: mockSubmissionId,
      })
      // Expect 200 ok
      expect(mockRes.status).not.toHaveBeenCalled() // default is 200 ok
    })

    it('returns 400 bad request if attachment upload error occurs when createMultiRespondentFormSubmission', async () => {
      // Arrange
      const attachmentUploadError = new AttachmentUploadError()
      MockMultiRespondentSubmissionService.createMultiRespondentFormSubmission =
        jest.fn().mockReturnValue(errAsync(attachmentUploadError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 0,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitMultirespondentFormForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'Could not upload attachments for submission. For assistance, please contact the person who asked you to fill in this form.',
      })
    })

    it('returns 500 internal server error when submission fails to save', async () => {
      // Arrange
      const submissionSaveError = new SubmissionSaveError()
      MockMultiRespondentSubmissionService.createMultiRespondentFormSubmission =
        jest.fn().mockReturnValue(errAsync(submissionSaveError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 0,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitMultirespondentFormForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: submissionSaveError.message,
      })
    })

    it('returns 200 ok when step has invalid workflow type', async () => {
      // Arrange
      const invalidWorkflowTypeError = new InvalidWorkflowTypeError()
      MockMultiRespondentSubmissionService.performMultiRespondentPostSubmissionCreateActions =
        jest.fn().mockReturnValue(errAsync(invalidWorkflowTypeError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 0,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitMultirespondentFormForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).not.toHaveBeenCalled() // default is 200 ok
    })

    it('returns 200 ok when mail send error occurs', async () => {
      // Arrange
      const mailSendError = new MailSendError()
      MockMultiRespondentSubmissionService.performMultiRespondentPostSubmissionCreateActions =
        jest.fn().mockReturnValue(errAsync(mailSendError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 0,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitMultirespondentFormForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).not.toHaveBeenCalled() // default is 200 ok
    })
  })

  describe('updateMultirespondentSubmission', () => {
    it('returns 200 ok when form validation passes and invokes updateMultiRespondentFormSubmission and performMultiRespondentPostSubmissionUpdateActions', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 0,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await updateMultirespondentSubmissionForTest(mockSubmitMrfReq, mockRes)

      // Assert
      // save submission is invoked with correct args
      expect(
        MockMultiRespondentSubmissionService.updateMultiRespondentFormSubmission,
      ).toHaveBeenCalledOnce()
      expect(
        omit(
          MockMultiRespondentSubmissionService
            .updateMultiRespondentFormSubmission.mock.calls[0][0],
          'logMeta',
        ),
      ).toEqual({
        formId: mockFormId,
        submissionId: mockSubmissionId,
        encryptedPayload: mockSubmitMrfReq.formsg.encryptedPayload,
        form: mockSubmitMrfReq.formsg.formDef,
      })

      // Assert post save actions are invoked with correct args
      expect(
        MockMultiRespondentSubmissionService.performMultiRespondentPostSubmissionUpdateActions,
      ).toHaveBeenCalledOnce()
      expect(
        omit(
          MockMultiRespondentSubmissionService
            .performMultiRespondentPostSubmissionUpdateActions.mock.calls[0][0],
          'logMeta',
        ),
      ).toEqual({
        form: mockSubmitMrfReq.formsg.formDef,
        encryptedPayload: mockSubmitMrfReq.formsg.encryptedPayload,
        submissionId: mockSubmissionId,
      })
      // Expect 200 ok
      expect(mockRes.status).not.toHaveBeenCalled() // default is 200 ok
    })

    it('returns 400 bad request when attachment upload fails when updateMultiRespondentFormSubmission', async () => {
      // Arrange
      const attachmentUploadError = new AttachmentUploadError()
      MockMultiRespondentSubmissionService.updateMultiRespondentFormSubmission =
        jest.fn().mockReturnValue(errAsync(attachmentUploadError))
      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 1,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await updateMultirespondentSubmissionForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'Could not upload attachments for submission. For assistance, please contact the person who asked you to fill in this form.',
      })
    })

    it('returns 500 internal server error when submission fails to save', async () => {
      // Arrange
      const submissionSaveError = new SubmissionSaveError()
      MockMultiRespondentSubmissionService.updateMultiRespondentFormSubmission =
        jest.fn().mockReturnValue(errAsync(submissionSaveError))
      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 1,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await updateMultirespondentSubmissionForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: submissionSaveError.message,
        submissionId: mockSubmissionId,
      })
    })

    it('returns 404 not found when submission id not found', async () => {
      // Arrange
      const submissionNotFoundError = new SubmissionNotFoundError()
      MockMultiRespondentSubmissionService.updateMultiRespondentFormSubmission =
        jest.fn().mockReturnValue(errAsync(submissionNotFoundError))
      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 1,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await updateMultirespondentSubmissionForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: submissionNotFoundError.message,
      })
    })

    it('returns 200 ok when mail send error occurs', async () => {
      // Arrange
      const mailSendError = new MailSendError()
      MockMultiRespondentSubmissionService.performMultiRespondentPostSubmissionUpdateActions =
        jest.fn().mockReturnValue(errAsync(mailSendError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 1,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await updateMultirespondentSubmissionForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).not.toHaveBeenCalled() // default is 200 ok
    })

    it('returns 200 ok when step has invalid workflow type', async () => {
      // Arrange
      const invalidWorkflowTypeError = new InvalidWorkflowTypeError()
      MockMultiRespondentSubmissionService.performMultiRespondentPostSubmissionUpdateActions =
        jest.fn().mockReturnValue(errAsync(invalidWorkflowTypeError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockSubmitMrfReq = merge(mockReq, {
        formsg: {
          formDef: {
            _id: mockFormId,
            authType: FormAuthType.NIL,
            getUniqueMyInfoAttrs: jest.fn().mockReturnValue([]),
          },
          encryptedPayload: {
            encryptedContent: 'encryptedContent',
            version: 1,
            submissionPublicKey: 'submissionPublicKey',
            encryptedSubmissionSecretKey: 'encryptedSubmissionSecretKey',
            responses: {},
            workflowStep: 1,
          },
        } as any,
      })
      const mockRes = expressHandler.mockResponse()

      // Act
      await updateMultirespondentSubmissionForTest(mockSubmitMrfReq, mockRes)

      // Assert
      expect(mockRes.status).not.toHaveBeenCalled() // default is 200 ok
    })
  })
})
