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
  describe('nricMask', () => {
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

      MockSubmissionService.validateAttachments.mockReturnValueOnce(
        okAsync(true),
      )
      MockSubmissionService.sendEmailConfirmations.mockReturnValueOnce(
        okAsync(true),
      )
    })
    afterEach(() => {
      jest.clearAllMocks()
    })

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
