import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import expressHandler from '__tests__/unit/backend/helpers/jest-express'
import { ObjectId } from 'bson'
import { merge } from 'lodash'
import mongoose from 'mongoose'
import { ok, okAsync } from 'neverthrow'
import { FormAuthType, MyInfoAttribute } from 'shared/types'

import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import * as OidcService from 'src/app/modules/spcp/spcp.oidc.service/index'
import { OidcServiceType } from 'src/app/modules/spcp/spcp.oidc.service/spcp.oidc.service.types'
import * as VerifiedContentService from 'src/app/modules/verified-content/verified-content.service'
import {
  EncryptVerificationContentParams,
  SpVerifiedContent,
} from 'src/app/modules/verified-content/verified-content.types'
import MailService from 'src/app/services/mail/mail.service'
import { FormFieldSchema, IPopulatedEncryptedForm } from 'src/types'
import { EncryptSubmissionDto, FormCompleteDto } from 'src/types/api'

import { submitEncryptModeFormForTest } from '../encrypt-submission.controller'
import { SubmitEncryptModeFormHandlerRequest } from '../encrypt-submission.types'

jest.mock('src/app/utils/pipeline-middleware', () => {
  const MockPipeline = jest.fn().mockImplementation(() => {
    return {
      execute: jest.fn(() => {
        return okAsync(true)
      }),
    }
  })

  return {
    Pipeline: MockPipeline,
  }
})
jest.mock('src/app/modules/spcp/spcp.oidc.service')
jest.mock('src/app/services/mail/mail.service')
jest.mock('src/app/modules/verified-content/verified-content.service', () => {
  const originalModule = jest.requireActual(
    'src/app/modules/verified-content/verified-content.service',
  )
  return {
    ...originalModule,
    getVerifiedContent: jest.fn(originalModule.getVerifiedContent),
    encryptVerifiedContent: jest.fn(
      ({ verifiedContent }: EncryptVerificationContentParams) =>
        ok((verifiedContent as SpVerifiedContent).uinFin),
    ),
  }
})

const MockOidcService = jest.mocked(OidcService)
const MockMailService = jest.mocked(MailService)
const MockVerifiedContentService = jest.mocked(VerifiedContentService)

const EncryptSubmission = getEncryptSubmissionModel(mongoose)

describe('encrypt-submission.controller', () => {
  describe('nricMask', () => {
    beforeAll(async () => await dbHandler.connect())
    afterEach(async () => await dbHandler.clearDatabase())
    afterAll(async () => await dbHandler.closeDatabase())

    beforeEach(() => {
      MockOidcService.getOidcService.mockReturnValue({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwt: (_arg1) => ok('jwt'),
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        extractJwtPayload: (_arg1) =>
          okAsync(merge(MOCK_JWT_PAYLOAD, MOCK_COOKIE_TIMESTAMP)),
      } as OidcServiceType<FormAuthType.SP>)

      MockMailService.sendSubmissionToAdmin.mockResolvedValue(okAsync(true))
    })

    const MOCK_NRIC = 'S1234567A'
    const MOCK_MASKED_NRIC = '*****567A'

    const MOCK_JWT_PAYLOAD = {
      userName: MOCK_NRIC,
      rememberMe: false,
    }
    const MOCK_COOKIE_TIMESTAMP = {
      iat: 1,
      exp: 1,
    }

    it('should mask nric if form isNricMaskEnabled is true', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndNricMaskingEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isNricMaskEnabled: true,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const MOCK_REQ = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndNricMaskingEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)

      // Assert
      // that verified content is generated using the masked nric
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockSpAuthTypeAndNricMaskingEnabledForm.authType,
        data: { uinFin: MOCK_MASKED_NRIC, userInfo: undefined },
      })
      // that the saved submission is masked
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission!.verifiedContent).toEqual(MOCK_MASKED_NRIC)
    })

    it('should not mask nric if form isNricMaskEnabled is false', async () => {
      // Arrange
      const mockFormId = new ObjectId()
      const mockSpAuthTypeAndNricMaskingEnabledForm = {
        _id: mockFormId,
        title: 'some form',
        authType: FormAuthType.SP,
        isNricMaskEnabled: false,
        form_fields: [] as FormFieldSchema[],
        getUniqueMyInfoAttrs: () => [] as MyInfoAttribute[],
      } as IPopulatedEncryptedForm

      const MOCK_REQ = merge(
        expressHandler.mockRequest({
          params: { formId: 'some id' },
          body: {
            responses: [],
          },
        }),
        {
          formsg: {
            encryptedPayload: {
              encryptedContent: 'encryptedContent',
              version: 1,
            },
            formDef: {
              authType: FormAuthType.SP,
            },
            encryptedFormDef: mockSpAuthTypeAndNricMaskingEnabledForm,
          } as unknown as EncryptSubmissionDto,
        } as unknown as FormCompleteDto,
      ) as unknown as SubmitEncryptModeFormHandlerRequest
      const mockRes = expressHandler.mockResponse()

      // Act
      await submitEncryptModeFormForTest(MOCK_REQ, mockRes)

      // Assert
      // that verified content is generated using the masked nric
      expect(
        MockVerifiedContentService.getVerifiedContent,
      ).toHaveBeenCalledWith({
        type: mockSpAuthTypeAndNricMaskingEnabledForm.authType,
        data: { uinFin: MOCK_NRIC, userInfo: undefined },
      })
      // that the saved submission is masked
      const savedSubmission = await EncryptSubmission.findOne()

      expect(savedSubmission).toBeDefined()
      expect(savedSubmission!.verifiedContent).toEqual(MOCK_NRIC)
    })
  })
})
