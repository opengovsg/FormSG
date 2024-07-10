import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { ok, okAsync } from 'neverthrow'
import { FormAuthType } from 'shared/types'

import * as FormService from 'src/app/modules/form/form.service'
import { SgidService } from 'src/app/modules/sgid/sgid.service'
import * as EmailSubmissionService from 'src/app/modules/submission/email-submission/email-submission.service'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import MailService from 'src/app/services/mail/mail.service'
import {
  FormFieldSchema,
  IEmailSubmissionSchema,
  IPopulatedEmailForm,
  IPopulatedForm,
} from 'src/types'

import { getCookieNameByAuthType } from '../../submission.utils'
import { submitEmailModeForm } from '../email-submission.controller'

jest.mock(
  'src/app/modules/submission/email-submission/email-submission.service',
)
jest.mock('src/app/modules/form/form.service')
jest.mock('src/app/modules/submission/submission.service')
jest.mock('src/app/modules/sgid/sgid.service')
jest.mock('src/app/modules/submission/submissions.statsd-client')
jest.mock('src/app/services/mail/mail.service')

const MockEmailSubmissionService = jest.mocked(EmailSubmissionService)
const MockFormService = jest.mocked(FormService)
const MockSubmissionService = jest.mocked(SubmissionService)
const MockSgidService = jest.mocked(SgidService)
const MockMailService = jest.mocked(MailService)

describe('email-submission.controller', () => {
  beforeEach(() => {
    const MOCK_SUBMISSION_HASH = {
      hash: 'some hash',
      salt: 'some salt',
    }
    MockEmailSubmissionService.hashSubmission.mockReturnValueOnce(
      okAsync(MOCK_SUBMISSION_HASH),
    )
    MockEmailSubmissionService.saveSubmissionMetadata.mockReturnValueOnce(
      okAsync({} as IEmailSubmissionSchema),
    )
    MockFormService.isFormPublic.mockReturnValueOnce(ok(true))

    MockMailService.sendSubmissionToAdmin.mockReturnValueOnce(okAsync(true))

    MockSubmissionService.validateAttachments.mockReturnValueOnce(okAsync(true))
    MockSubmissionService.sendEmailConfirmations.mockReturnValueOnce(
      okAsync(true),
    )
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('submitterId', () => {
    it('should hash submitterId if form is individual singpass type', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockIsSingleSubmissionEnabledEmailModeForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SGID,
        form_fields: [] as FormFieldSchema[],
      } as IPopulatedForm

      const MOCK_JWT_PAYLOAD_WITH_NRIC = {
        userName: 'submitterId',
      }
      const MOCK_VALID_SGID_PAYLOAD = {
        userName: MOCK_JWT_PAYLOAD_WITH_NRIC.userName,
        rememberMe: false,
      }

      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(mockIsSingleSubmissionEnabledEmailModeForm),
      )
      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
        ok(mockIsSingleSubmissionEnabledEmailModeForm as IPopulatedEmailForm),
      )
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
        okAsync(mockIsSingleSubmissionEnabledEmailModeForm),
      )
      MockSgidService.extractSgidSingpassJwtPayload.mockReturnValueOnce(
        ok(MOCK_VALID_SGID_PAYLOAD),
      )

      const mockReq = expressHandler.mockRequest({
        params: { formId: 'some id' },
        body: {
          responses: [],
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      // Act
      await submitEmailModeForm(mockReq, mockRes, jest.fn())

      // Assert the saving of submission metadata is called with the hashed submitterId
      expect(
        MockEmailSubmissionService.saveSubmissionMetadata,
      ).toHaveBeenCalledTimes(1)
      expect(
        MockEmailSubmissionService.saveSubmissionMetadata.mock.calls[0][3],
      ).toEqual(
        '151c329a583a82e4a768f16ab8c9b7ae621fcfdea574e87925dd56d7f73e367d',
      )
    })
  })

  describe('single submission per submitterId', () => {
    it('should return 200 ok and logout user when successfully submit form with single submission enabled', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSgidAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SGID,
        isSingleSubmission: true,
        form_fields: [] as FormFieldSchema[],
      } as IPopulatedForm
      const MOCK_JWT_PAYLOAD_WITH_NRIC = {
        userName: 'S1234567A',
      }
      const MOCK_VALID_SGID_PAYLOAD = {
        userName: MOCK_JWT_PAYLOAD_WITH_NRIC.userName,
        rememberMe: false,
      }
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndIsSingleSubmissionEnabledForm),
      )
      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
        ok(
          mockSgidAuthTypeAndIsSingleSubmissionEnabledForm as IPopulatedEmailForm,
        ),
      )
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndIsSingleSubmissionEnabledForm),
      )
      MockSgidService.extractSgidSingpassJwtPayload.mockReturnValueOnce(
        ok(MOCK_VALID_SGID_PAYLOAD),
      )

      const mockReq = expressHandler.mockRequest({
        params: { formId: 'some id' },
        body: {
          responses: [],
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      // Act
      await submitEmailModeForm(mockReq, mockRes, jest.fn())

      // Assert email should be sent
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)
      expect(
        MockSubmissionService.sendEmailConfirmations,
      ).toHaveBeenCalledTimes(1)
      // Assert status not set, which means default ok response status
      expect(mockRes.status).not.toHaveBeenCalled()
      // Assert user is logged out if submission is successful
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        getCookieNameByAuthType(
          mockSgidAuthTypeAndIsSingleSubmissionEnabledForm.authType as FormAuthType.SGID,
        ),
      )
    })
    it('should return json response with single submission validation failure flag when submission is not unique', async () => {
      // Arrange
      // simulate a submission with duplicate submitterId for the same form
      MockEmailSubmissionService.saveSubmissionMetadata.mockReset()
      MockEmailSubmissionService.saveSubmissionMetadata.mockReturnValueOnce(
        okAsync(null),
      )

      const mockFormId = new ObjectId()
      const mockSgidAuthTypeAndIsSingleSubmissionEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SGID,
        isSingleSubmission: true,
        form_fields: [] as FormFieldSchema[],
      } as IPopulatedForm
      const MOCK_JWT_PAYLOAD_WITH_NRIC = {
        userName: 'S1234567A',
      }
      const MOCK_VALID_SGID_PAYLOAD = {
        userName: MOCK_JWT_PAYLOAD_WITH_NRIC.userName,
        rememberMe: false,
      }
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndIsSingleSubmissionEnabledForm),
      )
      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
        ok(
          mockSgidAuthTypeAndIsSingleSubmissionEnabledForm as IPopulatedEmailForm,
        ),
      )
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndIsSingleSubmissionEnabledForm),
      )
      MockSgidService.extractSgidSingpassJwtPayload.mockReturnValueOnce(
        ok(MOCK_VALID_SGID_PAYLOAD),
      )

      const mockReq = expressHandler.mockRequest({
        params: { formId: 'some id' },
        body: {
          responses: [],
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      // Act
      await submitEmailModeForm(mockReq, mockRes, jest.fn())

      // Assert email should not be sent
      expect(MockMailService.sendSubmissionToAdmin).not.toHaveBeenCalled()
      expect(
        MockSubmissionService.sendEmailConfirmations,
      ).not.toHaveBeenCalled()

      // Assert that response has the single submission validation failure flag
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Your NRIC/FIN has already been used to respond to this form.',
        hasSingleSubmissionValidationFailure: true,
      })
    })
  })

  describe('nricMask', () => {
    it('should mask nric if form isNricMaskEnabled is true', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSgidAuthTypeAndNricMaskingEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SGID,
        isNricMaskEnabled: true,
        form_fields: [] as FormFieldSchema[],
      } as IPopulatedForm
      const MOCK_JWT_PAYLOAD_WITH_NRIC = {
        userName: 'S1234567A',
      }
      const MOCK_VALID_SGID_PAYLOAD = {
        userName: MOCK_JWT_PAYLOAD_WITH_NRIC.userName,
        rememberMe: false,
      }
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndNricMaskingEnabledForm),
      )
      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
        ok(mockSgidAuthTypeAndNricMaskingEnabledForm as IPopulatedEmailForm),
      )
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndNricMaskingEnabledForm),
      )
      MockSgidService.extractSgidSingpassJwtPayload.mockReturnValueOnce(
        ok(MOCK_VALID_SGID_PAYLOAD),
      )

      const MOCK_REQ = expressHandler.mockRequest({
        params: { formId: 'some id' },
        body: {
          responses: [],
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      // Act
      await submitEmailModeForm(MOCK_REQ, mockRes, jest.fn())

      // Assert email should be sent
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)
      expect(
        MockSubmissionService.sendEmailConfirmations,
      ).toHaveBeenCalledTimes(1)
      // Assert nric is masked in email payload
      expect(
        MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData[0]
          .answer,
      ).toEqual('*****567A')
    })

    it('should not mask nric if form isNricMaskEnabled is false', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSgidAuthTypeAndNricMaskingDisabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SGID,
        isNricMaskEnabled: false,
        form_fields: [] as FormFieldSchema[],
      } as IPopulatedForm
      const MOCK_JWT_PAYLOAD_WITH_NRIC = {
        userName: 'S1234567A',
      }
      const MOCK_VALID_SGID_PAYLOAD = {
        userName: MOCK_JWT_PAYLOAD_WITH_NRIC.userName,
        rememberMe: false,
      }
      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndNricMaskingDisabledForm),
      )
      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
        ok(mockSgidAuthTypeAndNricMaskingDisabledForm as IPopulatedEmailForm),
      )
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndNricMaskingDisabledForm),
      )
      MockSgidService.extractSgidSingpassJwtPayload.mockReturnValueOnce(
        ok(MOCK_VALID_SGID_PAYLOAD),
      )

      const MOCK_REQ = expressHandler.mockRequest({
        params: { formId: 'some id' },
        body: {
          responses: [],
        },
      })
      const mockRes = expressHandler.mockResponse({
        clearCookie: jest.fn().mockReturnThis(),
      })

      // Act
      await submitEmailModeForm(MOCK_REQ, mockRes, jest.fn())

      // Assert email should be sent
      expect(MockMailService.sendSubmissionToAdmin).toHaveBeenCalledTimes(1)
      expect(
        MockSubmissionService.sendEmailConfirmations,
      ).toHaveBeenCalledTimes(1)
      // Assert nric is not masked
      expect(
        MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData[0]
          .answer,
      ).toEqual(MOCK_JWT_PAYLOAD_WITH_NRIC.userName)
    })
  })
})
