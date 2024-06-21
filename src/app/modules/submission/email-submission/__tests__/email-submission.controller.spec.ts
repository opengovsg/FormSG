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
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('maskNric', () => {
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
      const MOCK_SUBMISSION_HASH: SubmissionHash = {
        hash: 'some hash',
        salt: 'some salt',
      }

      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndNricMaskingEnabledForm),
      )

      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
        ok(mockSgidAuthTypeAndNricMaskingEnabledForm as IPopulatedEmailForm),
      )
      MockEmailSubmissionService.hashSubmission.mockReturnValueOnce(
        okAsync(MOCK_SUBMISSION_HASH),
      )
      MockEmailSubmissionService.saveSubmissionMetadata.mockReturnValueOnce(
        okAsync({} as IEmailSubmissionSchema),
      )

      MockFormService.isFormPublic.mockReturnValueOnce(ok(true))
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
        okAsync(mockSgidAuthTypeAndNricMaskingEnabledForm),
      )

      MockMailService.sendSubmissionToAdmin.mockReturnValueOnce(okAsync(true))

      MockSubmissionService.validateAttachments.mockReturnValueOnce(
        okAsync(true),
      )
      MockSubmissionService.sendEmailConfirmations.mockReturnValueOnce(
        okAsync(true),
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
      // Assert nric is masked
      expect(
        MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData[0]
          .answer,
      ).toEqual('*****567A')
    })
  })
})
