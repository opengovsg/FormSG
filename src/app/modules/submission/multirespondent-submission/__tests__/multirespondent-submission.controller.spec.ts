import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { merge, omit } from 'lodash'
import { Types } from 'mongoose'
import { errAsync, ok, okAsync } from 'neverthrow'
import { FormAuthType, FormMetadata, FormResponseMode, FormStatus, PublicMultirespondentSubmissionDto } from 'shared/types'

import * as AuthService from 'src/app/modules/auth/auth.service'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import * as AdminFormService from 'src/app/modules/form/admin-form/admin-form.service'
import {
  ForbiddenFormError,
  FormNotFoundError,
} from 'src/app/modules/form/form.errors'
import * as FormService from 'src/app/modules/form/form.service'
import { MissingUserError } from 'src/app/modules/user/user.errors'
import * as UserService from 'src/app/modules/user/user.service'
import { MailSendError } from 'src/app/services/mail/mail.errors'
import { IMultirespondentSubmissionSchema, MultirespondentSubmissionData } from 'src/types'
import { SnapshottedFormDef } from 'src/types/api'

import {
  AttachmentUploadError,
  InvalidWorkflowTypeError,
  MrfReminderInvalidWorkflowStepError,
  MrfReminderRecipientEmailsEmptyError,
  SubmissionNotFoundError,
  SubmissionSaveError,
} from '../../submission.errors'
import {
  handleGetMultirespondentSubmissionForRespondent,
  sendPendingMrfSubmissionReminderForTest,
  submitMultirespondentFormForTest,
  updateMultirespondentSubmissionForTest,
} from '../multirespondent-submission.controller'
import * as MultiRespondentSubmissionService from '../multirespondent-submission.service'

jest.mock('src/app/modules/datadog/datadog.utils')

jest.mock('src/app/modules/form/form.service')
const MockFormService = jest.mocked(FormService)

jest.mock('src/app/modules/form/admin-form/admin-form.service', () => ({
  ...jest.requireActual('src/app/modules/form/admin-form/admin-form.service'),
  updateFormMetadata: jest.fn(),
}))

jest.mock('src/app/modules/auth/auth.service', () => ({
  ...jest.requireActual('src/app/modules/auth/auth.service'),
  getFormAfterPermissionChecks: jest.fn(),
}))

jest.mock('src/app/modules/user/user.service', () => ({
  ...jest.requireActual('src/app/modules/user/user.service'),
  findUserById: jest.fn(),
}))

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

describe('multirespondent-submision.controller', () => {
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

  describe('handleGetMultirespondentSubmissionForRespondent', () => {
    it('returns 200 ok with public multirespondent submission data response and invokes createPublicMultirespondentSubmissionDto to strip the sensitive information', async () => {
      // Arrange 
      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {} as any,
      })
      const mockRes = expressHandler.mockResponse()
      const mockSubmissionData = {
        _id: mockSubmissionId,
        form_fields: [],
        workflow: [],
        attachmentMetadata: {},
        version: 1,
        mrfVersion: 1,
      } as unknown as MultirespondentSubmissionData
      const mockPresignedUrls = {
        mockSubmissionId: 'mockPresignedUrl',
      }
      const mockPublicMultirespondentSubmissionDto = {
        _id: mockSubmissionId,
        form_fields: [],
        workflow: [],
      } as unknown as PublicMultirespondentSubmissionDto
      
      MockFormService.retrieveFullFormById = jest.fn().mockReturnValue(
        okAsync({
          _id: mockFormId,
          responseMode: FormResponseMode.Multirespondent,
          title: 'Mock Form',
          status: FormStatus.Public,
        }),
      )
      const mockCreatePublicMultirespondentSubmissionDto = jest.fn().mockReturnValue(mockPublicMultirespondentSubmissionDto)
      jest.mock('src/app/modules/submission/multirespondent-submission/multirespondent-submission.utils', () => ({
        ...jest.requireActual('src/app/modules/submission/multirespondent-submission/multirespondent-submission.utils'),
        createPublicMultirespondentSubmissionDto: mockCreatePublicMultirespondentSubmissionDto,
      }))
      // Act
      await handleGetMultirespondentSubmissionForRespondent(mockReq, mockRes, jest.fn())

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockPublicMultirespondentSubmissionDto)
      expect(mockCreatePublicMultirespondentSubmissionDto).toHaveBeenCalledWith(mockSubmissionData, mockPresignedUrls)
    })
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
        submission: {
          _id: mockSubmissionId,
        },
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
    it('returns 400 bad request if snapshottedFormDef is not provided when updating mrf submission', async () => {
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
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message:
          'The form submission could not be processed. Please try again.',
      })
    })

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
          snapshottedFormDef: {
            _id: mockFormId,
            form_fields: [],
            form_logics: [],
            workflow: [],
            emails: [],
            stepOneEmailNotificationFieldId: '',
            stepsToNotify: [],
            hasRespondentCopy: false,
            title: 'Mock snapshotted form def',
            webhook: {
              url: '',
              isRetryEnabled: false,
            },
          } as SnapshottedFormDef,
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
        submissionId: mockSubmissionId,
        encryptedPayload: mockSubmitMrfReq.formsg.encryptedPayload,
        snapshottedFormDef: mockSubmitMrfReq.formsg.snapshottedFormDef,
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
        snapshottedFormDef: mockSubmitMrfReq.formsg.snapshottedFormDef,
        encryptedPayload: mockSubmitMrfReq.formsg.encryptedPayload,
        submissionId: mockSubmissionId,
        submission: {
          _id: mockSubmissionId,
        },
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
          snapshottedFormDef: {
            _id: mockFormId,
            form_fields: [],
            form_logics: [],
            workflow: [],
            emails: [],
            stepOneEmailNotificationFieldId: '',
            stepsToNotify: [],
            hasRespondentCopy: false,
            title: 'Mock snapshotted form def',
            webhook: {
              url: '',
              isRetryEnabled: false,
            },
          } as SnapshottedFormDef,
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
          snapshottedFormDef: {
            _id: mockFormId,
            form_fields: [],
            form_logics: [],
            workflow: [],
            emails: [],
            stepOneEmailNotificationFieldId: '',
            stepsToNotify: [],
            hasRespondentCopy: false,
            title: 'Mock snapshotted form def',
            webhook: {
              url: '',
              isRetryEnabled: false,
            },
          } as SnapshottedFormDef,
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
          snapshottedFormDef: {
            _id: mockFormId,
            form_fields: [],
            form_logics: [],
            workflow: [],
            emails: [],
            stepOneEmailNotificationFieldId: '',
            stepsToNotify: [],
            hasRespondentCopy: false,
            title: 'Mock snapshotted form def',
            webhook: {
              url: '',
              isRetryEnabled: false,
            },
          } as SnapshottedFormDef,
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
          snapshottedFormDef: {
            _id: mockFormId,
            form_fields: [],
            form_logics: [],
            workflow: [],
            emails: [],
            stepOneEmailNotificationFieldId: '',
            stepsToNotify: [],
            hasRespondentCopy: false,
            title: 'Mock snapshotted form def',
            webhook: {
              url: '',
              isRetryEnabled: false,
            },
          } as SnapshottedFormDef,
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
          snapshottedFormDef: {
            _id: mockFormId,
            form_fields: [],
            form_logics: [],
            workflow: [],
            emails: [],
            stepOneEmailNotificationFieldId: '',
            stepsToNotify: [],
            hasRespondentCopy: false,
            title: 'Mock snapshotted form def',
            webhook: {
              url: '',
              isRetryEnabled: false,
            },
          } as SnapshottedFormDef,
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

  describe('sendPendingMrfSubmissionReminderForTest', () => {
    const MOCK_USER = {
      _id: 'mockUserId',
      email: 'test@example.com',
    }

    beforeEach(() => {
      const mockedUpdateformMetadata =
        AdminFormService.updateFormMetadata as jest.Mock
      mockedUpdateformMetadata.mockReturnValue(okAsync({} as FormMetadata))

      const mockedFindUserById = UserService.findUserById as jest.Mock
      mockedFindUserById.mockReturnValue(
        okAsync({
          _id: MOCK_USER._id,
          email: MOCK_USER.email,
        }),
      )

      const mockedGetFormAfterPermissionChecks =
        AuthService.getFormAfterPermissionChecks as jest.Mock
      mockedGetFormAfterPermissionChecks.mockReturnValue(
        okAsync({
          _id: mockFormId,
          responseMode: FormResponseMode.Multirespondent,
          title: 'Mock Form',
        }),
      )
    })

    it('returns 401 when findUserById returns MissingUserError', async () => {
      // Arrange
      const mockedFindUserById = UserService.findUserById as jest.Mock
      mockedFindUserById.mockReturnValue(errAsync(new MissingUserError()))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(422)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not found',
      })
    })

    it('returns 401 when getFormAfterPermissionChecks returns ForbiddenFormError', async () => {
      // Arrange
      const mockedGetFormAfterPermissionChecks =
        AuthService.getFormAfterPermissionChecks as jest.Mock
      mockedGetFormAfterPermissionChecks.mockReturnValue(
        errAsync(new ForbiddenFormError('User not authorized to access form')),
      )

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'User not authorized to access form',
      })
    })

    it('returns 200 ok when recipient email found and reminder email is sent successfully', async () => {
      // Arrange
      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      const MOCK_RECIPIENT_EMAILS = ['test@example.com', 'test2@example.com']

      MockMultiRespondentSubmissionService.getPendingStepRecipientEmailsFromSubmittedStepsMeta =
        jest.fn().mockReturnValue(
          okAsync({
            recipientEmails: MOCK_RECIPIENT_EMAILS,
            reminderStepNumber: 1,
          }),
        )

      MockMultiRespondentSubmissionService.sendNextStepReminderEmail = jest
        .fn()
        .mockReturnValue(okAsync(true))

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Reminder sent successfully.',
        submissionId: mockSubmissionId,
      })
      expect(
        MockMultiRespondentSubmissionService.getPendingStepRecipientEmailsFromSubmittedStepsMeta,
      ).toHaveBeenCalledWith({
        submissionId: mockSubmissionId,
      })

      expect(
        MockMultiRespondentSubmissionService.sendNextStepReminderEmail,
      ).toHaveBeenCalledWith({
        submissionId: mockSubmissionId,
        emails: MOCK_RECIPIENT_EMAILS,
        responseUrl: expect.any(String),
        formTitle: 'Mock Form',
        formId: mockFormId,
        reminderStepNumber: 1,
        senderEmail: MOCK_USER.email,
      })
    })

    it('returns 404 when retrieveFormById encounters FormNotFoundError', async () => {
      // Arrange
      const formNotFoundError = new FormNotFoundError('Form not found')
      const mockedGetFormAfterPermissionChecks =
        AuthService.getFormAfterPermissionChecks as jest.Mock
      mockedGetFormAfterPermissionChecks.mockReturnValue(
        errAsync(formNotFoundError),
      )

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: formNotFoundError.message,
      })
    })

    it('returns 500 when retrieveFormById encounters DatabaseError', async () => {
      // Arrange
      const databaseError = new DatabaseError('Database error')
      const mockedGetFormAfterPermissionChecks =
        AuthService.getFormAfterPermissionChecks as jest.Mock
      mockedGetFormAfterPermissionChecks.mockReturnValue(
        errAsync(databaseError),
      )

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: databaseError.message,
      })
    })

    it('returns 500 when getPendingStepRecipientEmailsFromSubmittedStepsMeta encounters DatabaseError', async () => {
      // Arrange
      const databaseError = new DatabaseError('Database error')
      MockFormService.retrieveFormById = jest.fn().mockReturnValue(
        okAsync({
          _id: mockFormId,
          responseMode: FormResponseMode.Multirespondent,
          title: 'Mock Form',
        }),
      )

      MockMultiRespondentSubmissionService.getPendingStepRecipientEmailsFromSubmittedStepsMeta =
        jest.fn().mockReturnValue(errAsync(databaseError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: databaseError.message,
      })
    })

    it('returns 404 when getPendingStepRecipientEmailsFromSubmittedStepsMeta encounters SubmissionNotFoundError', async () => {
      // Arrange
      const submissionNotFoundError = new SubmissionNotFoundError(
        'Submission not found',
      )
      MockFormService.retrieveFormById = jest.fn().mockReturnValue(
        okAsync({
          _id: mockFormId,
          responseMode: FormResponseMode.Multirespondent,
          title: 'Mock Form',
        }),
      )

      MockMultiRespondentSubmissionService.getPendingStepRecipientEmailsFromSubmittedStepsMeta =
        jest.fn().mockReturnValue(errAsync(submissionNotFoundError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(404)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: submissionNotFoundError.message,
      })
    })

    it('returns 400 when getPendingStepRecipientEmailsFromSubmittedStepsMeta encounters MrfReminderInvalidWorkflowStepError', async () => {
      // Arrange
      const invalidWorkflowStepError = new MrfReminderInvalidWorkflowStepError()
      MockFormService.retrieveFormById = jest.fn().mockReturnValue(
        okAsync({
          _id: mockFormId,
          responseMode: FormResponseMode.Multirespondent,
          title: 'Mock Form',
        }),
      )

      MockMultiRespondentSubmissionService.getPendingStepRecipientEmailsFromSubmittedStepsMeta =
        jest.fn().mockReturnValue(errAsync(invalidWorkflowStepError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: invalidWorkflowStepError.message,
      })
    })

    it('returns 400 when getPendingStepRecipientEmailsFromSubmittedStepsMeta encounters MrfReminderRecipientEmailsEmptyError', async () => {
      // Arrange
      const emptyRecipientsError = new MrfReminderRecipientEmailsEmptyError()
      MockFormService.retrieveFormById = jest.fn().mockReturnValue(
        okAsync({
          _id: mockFormId,
          responseMode: FormResponseMode.Multirespondent,
          title: 'Mock Form',
        }),
      )

      MockMultiRespondentSubmissionService.getPendingStepRecipientEmailsFromSubmittedStepsMeta =
        jest.fn().mockReturnValue(errAsync(emptyRecipientsError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: emptyRecipientsError.message,
      })
    })

    it('returns 500 when sendNextStepReminderEmail encounters MailSendError', async () => {
      // Arrange
      const mailSendError = new MailSendError('Failed to send email')
      MockFormService.retrieveFormById = jest.fn().mockReturnValue(
        okAsync({
          _id: mockFormId,
          responseMode: FormResponseMode.Multirespondent,
          title: 'Mock Form',
        }),
      )

      MockMultiRespondentSubmissionService.getPendingStepRecipientEmailsFromSubmittedStepsMeta =
        jest.fn().mockReturnValue(
          okAsync({
            recipientEmails: ['test@example.com'],
            reminderStepNumber: 1,
          }),
        )

      MockMultiRespondentSubmissionService.sendNextStepReminderEmail = jest
        .fn()
        .mockReturnValue(errAsync(mailSendError))

      const mockReq = expressHandler.mockRequest({
        params: {
          formId: mockFormId,
          submissionId: mockSubmissionId,
        },
        body: {
          submissionSecretKey: 'mockSubmissionSecretKey',
        },
        session: {
          user: {
            _id: MOCK_USER._id,
          },
        },
      })
      const mockRes = expressHandler.mockResponse()
      const mockNext = jest.fn()

      // Act
      await sendPendingMrfSubmissionReminderForTest(mockReq, mockRes, mockNext)

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500)
      expect(mockRes.json).toHaveBeenCalledWith({
        message: mailSendError.message,
      })
    })
  })
})
