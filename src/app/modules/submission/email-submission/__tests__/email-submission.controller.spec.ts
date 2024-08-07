import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { merge } from 'lodash'
import { ok, okAsync } from 'neverthrow'
import { ErrorCode, FormAuthType } from 'shared/types'

import * as FormService from 'src/app/modules/form/form.service'
import { SgidService } from 'src/app/modules/sgid/sgid.service'
import * as OidcService from 'src/app/modules/spcp/spcp.oidc.service/index'
import { OidcServiceType } from 'src/app/modules/spcp/spcp.oidc.service/spcp.oidc.service.types'
import * as EmailSubmissionService from 'src/app/modules/submission/email-submission/email-submission.service'
import * as SubmissionService from 'src/app/modules/submission/submission.service'
import MailService from 'src/app/services/mail/mail.service'
import {
  FormFieldSchema,
  IEmailSubmissionSchema,
  IPopulatedEmailForm,
  IPopulatedForm,
} from 'src/types'

import {
  generateHashedSubmitterId,
  getCookieNameByAuthType,
} from '../../submission.utils'
import { submitEmailModeForm } from '../email-submission.controller'

jest.mock('src/app/modules/datadog/datadog.utils')
jest.mock(
  'src/app/modules/submission/email-submission/email-submission.service',
)
jest.mock('src/app/modules/form/form.service')
jest.mock('src/app/modules/spcp/spcp.oidc.service')
jest.mock('src/app/modules/submission/submission.service')
jest.mock('src/app/modules/sgid/sgid.service')
jest.mock('src/app/modules/submission/submissions.statsd-client')
jest.mock('src/app/services/mail/mail.service')

const MockEmailSubmissionService = jest.mocked(EmailSubmissionService)
const MockFormService = jest.mocked(FormService)
const MockSubmissionService = jest.mocked(SubmissionService)
const MockSgidService = jest.mocked(SgidService)
const MockMailService = jest.mocked(MailService)
const MockOidcService = jest.mocked(OidcService)

describe('email-submission.controller', () => {
  beforeEach(() => {
    const MOCK_SUBMISSION_HASH = {
      hash: 'some hash',
      salt: 'some salt',
    }
    MockEmailSubmissionService.hashSubmission.mockReturnValue(
      okAsync(MOCK_SUBMISSION_HASH),
    )
    MockEmailSubmissionService.saveSubmissionMetadata.mockReturnValue(
      okAsync({} as IEmailSubmissionSchema),
    )
    MockFormService.isFormPublic.mockReturnValue(ok(true))

    MockMailService.sendSubmissionToAdmin.mockReturnValue(okAsync(true))

    MockSubmissionService.validateAttachments.mockReturnValue(okAsync(true))
    MockSubmissionService.sendEmailConfirmations.mockReturnValue(okAsync(true))
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('submitterId', () => {
    const MOCK_COOKIE_TIMESTAMP = {
      iat: 1,
      exp: 1,
    }
    it('should have same submitterId if same uen but different nric for corppass', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockIsSingleSubmissionEnabledEmailModeForm = {
        _id: mockFormId,
        id: mockFormId.toHexString(),
        title: 'some form',
        authType: FormAuthType.CP,
        form_fields: [] as FormFieldSchema[],
      } as IPopulatedForm

      const UEN = 'uen'
      const NRIC_1 = 'S1234567A'
      const NRIC_2 = 'S1234567B'
      const MOCK_JWT_PAYLOAD_1 = {
        userName: UEN,
        userInfo: NRIC_1,
        rememberMe: false,
      }
      const MOCK_JWT_PAYLOAD_2 = {
        userName: UEN,
        userInfo: NRIC_2,
        rememberMe: false,
      }

      MockOidcService.getOidcService
        .mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_JWT_PAYLOAD_1, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)
        .mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_JWT_PAYLOAD_2, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)

      MockFormService.retrieveFullFormById.mockReturnValue(
        okAsync(mockIsSingleSubmissionEnabledEmailModeForm),
      )
      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValue(
        ok(mockIsSingleSubmissionEnabledEmailModeForm as IPopulatedEmailForm),
      )
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValue(
        okAsync(mockIsSingleSubmissionEnabledEmailModeForm),
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
      await submitEmailModeForm(mockReq, mockRes, jest.fn())

      // Assert
      expect(
        MockEmailSubmissionService.saveSubmissionMetadata,
      ).toHaveBeenCalledTimes(2)
      expect(
        MockEmailSubmissionService.saveSubmissionMetadata.mock.calls[0][3],
      ).toEqual(
        MockEmailSubmissionService.saveSubmissionMetadata.mock.calls[1][3],
      )
    })

    it('should have different submitterId if different uen but same nric for corppass', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockIsSingleSubmissionEnabledEmailModeForm = {
        _id: mockFormId,
        id: mockFormId.toHexString(),
        title: 'some form',
        authType: FormAuthType.CP,
        form_fields: [] as FormFieldSchema[],
      } as IPopulatedForm

      const UEN_1 = 'uen1'
      const UEN_2 = 'uen2'
      const NRIC = 'S1234567A'
      const MOCK_JWT_PAYLOAD_1 = {
        userName: UEN_1,
        userInfo: NRIC,
        rememberMe: false,
      }
      const MOCK_JWT_PAYLOAD_2 = {
        userName: UEN_2,
        userInfo: NRIC,
        rememberMe: false,
      }

      MockOidcService.getOidcService
        .mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_JWT_PAYLOAD_1, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)
        .mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_JWT_PAYLOAD_2, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)

      MockFormService.retrieveFullFormById.mockReturnValue(
        okAsync(mockIsSingleSubmissionEnabledEmailModeForm),
      )
      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValue(
        ok(mockIsSingleSubmissionEnabledEmailModeForm as IPopulatedEmailForm),
      )
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValue(
        okAsync(mockIsSingleSubmissionEnabledEmailModeForm),
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
      await submitEmailModeForm(mockReq, mockRes, jest.fn())

      // Assert
      expect(
        MockEmailSubmissionService.saveSubmissionMetadata,
      ).toHaveBeenCalledTimes(2)
      expect(
        MockEmailSubmissionService.saveSubmissionMetadata.mock.calls[0][3],
      ).not.toEqual(
        MockEmailSubmissionService.saveSubmissionMetadata.mock.calls[1][3],
      )
    })

    it('should hash submitterId if form is individual singpass type', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockIsSingleSubmissionEnabledEmailModeForm = {
        _id: mockFormId,
        id: mockFormId.toHexString(),
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
        generateHashedSubmitterId(
          MOCK_JWT_PAYLOAD_WITH_NRIC.userName,
          mockIsSingleSubmissionEnabledEmailModeForm.id,
        ),
      )
    })

    it('should hash submitterId for CP form', async () => {
      // Arrange
      const MOCK_JWT_PAYLOAD = {
        userName: 'uen',
        userInfo: 'S1234567A',
        rememberMe: false,
      }
      MockOidcService.getOidcService.mockReturnValueOnce({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.CP>)

      const mockFormId = new ObjectId()
      const mockIsSingleSubmissionEnabledEmailModeForm = {
        _id: mockFormId,
        id: mockFormId.toHexString(),
        title: 'some form',
        authType: FormAuthType.CP,
        form_fields: [] as FormFieldSchema[],
      } as IPopulatedForm

      MockFormService.retrieveFullFormById.mockReturnValueOnce(
        okAsync(mockIsSingleSubmissionEnabledEmailModeForm),
      )
      MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
        ok(mockIsSingleSubmissionEnabledEmailModeForm as IPopulatedEmailForm),
      )
      MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
        okAsync(mockIsSingleSubmissionEnabledEmailModeForm),
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
        generateHashedSubmitterId(
          MOCK_JWT_PAYLOAD.userName,
          mockIsSingleSubmissionEnabledEmailModeForm.id,
        ),
      )
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
          message:
            'Your NRIC/FIN/UEN has already been used to respond to this form.',
          errorCodes: [ErrorCode.respondentSingleSubmissionValidationFailure],
        })
      })
    })

    describe('submitter login id collection', () => {
      const MOCK_JWT_PAYLOAD = {
        userName: 'nric',
      }
      const MOCK_VALID_SGID_PAYLOAD = {
        userName: MOCK_JWT_PAYLOAD.userName,
        rememberMe: false,
      }

      const MOCK_CP_JWT_PAYLOAD = {
        userName: 'uen',
        userInfo: 'nric',
        rememberMe: false,
      }

      beforeEach(() => {
        // For SGID auth type
        MockSgidService.extractSgidSingpassJwtPayload.mockReturnValueOnce(
          ok(MOCK_VALID_SGID_PAYLOAD),
        )

        // For CP auth type
        MockOidcService.getOidcService.mockReturnValueOnce({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwt: (_arg1) => ok('jwt'),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          extractJwtPayload: (_arg1) =>
            okAsync(merge(MOCK_CP_JWT_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
        } as OidcServiceType<FormAuthType.CP>)
      })

      it('should send nric if form isSubmitterIdCollectionEnabled is true for SgId authType', async () => {
        // Arrange
        const mockFormId = new ObjectId()
        const mockSgidAuthTypeAndSubmitterIdCollectionEnabledForm = {
          _id: mockFormId,
          title: 'some form',
          authType: FormAuthType.SGID,
          isSubmitterIdCollectionEnabled: true,
          form_fields: [] as FormFieldSchema[],
        } as IPopulatedForm
        MockFormService.retrieveFullFormById.mockReturnValueOnce(
          okAsync(mockSgidAuthTypeAndSubmitterIdCollectionEnabledForm),
        )
        MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
          ok(
            mockSgidAuthTypeAndSubmitterIdCollectionEnabledForm as IPopulatedEmailForm,
          ),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(mockSgidAuthTypeAndSubmitterIdCollectionEnabledForm),
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
        // Assert nric and uen is included in email payload
        expect(
          MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData[0]
            .answer,
        ).toEqual(MOCK_JWT_PAYLOAD.userName)
      })

      it('should not send nric if form isSubmitterIdCollectionEnabled is false for SgId authType', async () => {
        // Arrange
        const mockFormId = new ObjectId()
        const mockSgidAuthTypeAndSubmitterIdCollectionDisabledForm = {
          _id: mockFormId,
          title: 'some form',
          authType: FormAuthType.SGID,
          isSubmitterIdCollectionEnabled: false,
          form_fields: [] as FormFieldSchema[],
        } as IPopulatedForm
        MockFormService.retrieveFullFormById.mockReturnValueOnce(
          okAsync(mockSgidAuthTypeAndSubmitterIdCollectionDisabledForm),
        )
        MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
          ok(
            mockSgidAuthTypeAndSubmitterIdCollectionDisabledForm as IPopulatedEmailForm,
          ),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(mockSgidAuthTypeAndSubmitterIdCollectionDisabledForm),
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
        // Assert nric is not contained in email payload, hence empty array since no other fields
        expect(
          MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData,
        ).toEqual([])
      })

      it('should send nric if form isSubmitterIdCollectionEnabled is true for Cp authType', async () => {
        // Arrange
        const mockFormId = new ObjectId()
        const mockCpAuthTypeAndSubmitterIdCollectionEnabledForm = {
          _id: mockFormId,
          title: 'some form',
          authType: FormAuthType.CP,
          isSubmitterIdCollectionEnabled: true,
          form_fields: [] as FormFieldSchema[],
        } as IPopulatedForm
        MockFormService.retrieveFullFormById.mockReturnValueOnce(
          okAsync(mockCpAuthTypeAndSubmitterIdCollectionEnabledForm),
        )
        MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
          ok(
            mockCpAuthTypeAndSubmitterIdCollectionEnabledForm as IPopulatedEmailForm,
          ),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(mockCpAuthTypeAndSubmitterIdCollectionEnabledForm),
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
        // Assert nric is included in email payload
        expect(
          MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData,
        ).toHaveLength(2)
        expect(
          MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData.filter(
            (r) => r.question === 'CorpPass Validated UEN',
          )[0].answer,
        ).toEqual(MOCK_CP_JWT_PAYLOAD.userName)
        expect(
          MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData.filter(
            (r) => r.question === 'CorpPass Validated UID',
          )[0].answer,
        ).toEqual(MOCK_CP_JWT_PAYLOAD.userInfo)
      })

      it('should not send nric if form isSubmitterIdCollectionEnabled is false for Cp authType', async () => {
        // Arrange
        const mockFormId = new ObjectId()
        const mockSgidAuthTypeAndSubmitterIdCollectionDisabledForm = {
          _id: mockFormId,
          title: 'some form',
          authType: FormAuthType.CP,
          isSubmitterIdCollectionEnabled: false,
          form_fields: [] as FormFieldSchema[],
        } as IPopulatedForm
        MockFormService.retrieveFullFormById.mockReturnValueOnce(
          okAsync(mockSgidAuthTypeAndSubmitterIdCollectionDisabledForm),
        )
        MockEmailSubmissionService.checkFormIsEmailMode.mockReturnValueOnce(
          ok(
            mockSgidAuthTypeAndSubmitterIdCollectionDisabledForm as IPopulatedEmailForm,
          ),
        )
        MockFormService.checkFormSubmissionLimitAndDeactivateForm.mockReturnValueOnce(
          okAsync(mockSgidAuthTypeAndSubmitterIdCollectionDisabledForm),
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
        // Assert nric is not contained in email payload, hence empty array since no other fields
        expect(
          MockMailService.sendSubmissionToAdmin.mock.calls[0][0].formData,
        ).toEqual([])
      })
    })
  })
})
