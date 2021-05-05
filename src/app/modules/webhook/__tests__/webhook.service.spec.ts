import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import formsgSdk from 'src/app/config/formsg-sdk'
import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { WebhookValidationError } from 'src/app/modules/webhook/webhook.errors'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import { transformMongoError } from 'src/app/utils/handle-mongo-error'
import { IWebhookResponse, WebhookView } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { SubmissionNotFoundError } from '../../submission/submission.errors'
import { saveWebhookRecord, sendWebhook } from '../webhook.service'

// define suite-wide mocks
jest.mock('axios')
const MockAxios = mocked(axios, true)

jest.mock('src/app/modules/webhook/webhook.validation')
const MockWebhookValidationModule = mocked(WebhookValidationModule, true)

jest.mock('src/app/config/formsg-sdk')
const MockFormSgSdk = mocked(formsgSdk, true)

const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

// define test constants

const MOCK_WEBHOOK_URL = 'https://form.gov.sg/endpoint'
const DEFAULT_ERROR_MSG = 'a generic error has occurred'
const AXIOS_ERROR_MSG = 'an axios error has occurred'

const MOCK_AXIOS_SUCCESS_RESPONSE: AxiosResponse = {
  data: {
    result: 'test-result',
  },
  status: 200,
  statusText: 'success',
  headers: {},
  config: {},
}
const MOCK_AXIOS_FAILURE_RESPONSE: AxiosResponse = {
  data: {
    result: 'test-result',
  },
  status: 400,
  statusText: 'failed',
  headers: {},
  config: {},
}
const MOCK_WEBHOOK_SUCCESS_RESPONSE: Pick<IWebhookResponse, 'response'> = {
  response: {
    data: '{"result":"test-result"}',
    status: 200,
    headers: '{}',
  },
}
const MOCK_WEBHOOK_FAILURE_RESPONSE: Pick<IWebhookResponse, 'response'> = {
  response: {
    data: '{"result":"test-result"}',
    status: 400,
    headers: '{}',
  },
}
const MOCK_WEBHOOK_DEFAULT_FORMAT_RESPONSE: Pick<
  IWebhookResponse,
  'response'
> = {
  response: {
    data: '',
    status: 0,
    headers: '',
  },
}

describe('webhook.service', () => {
  const MOCK_FORM_ID = new ObjectId().toHexString()
  const MOCK_SUBMISSION_ID = new ObjectId().toHexString()
  const MOCK_WEBHOOK_VIEW: WebhookView = {
    data: {
      created: new Date(),
      encryptedContent: 'mockEncryptedContent',
      formId: MOCK_FORM_ID,
      submissionId: MOCK_SUBMISSION_ID,
      verifiedContent: 'mockVerifiedContent',
      version: 1,
    },
  }
  const MOCK_SIGNATURE = 'mockSignature'

  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    await dbHandler.clearDatabase()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  // test variables
  let testConfig: AxiosRequestConfig

  beforeEach(async () => {
    jest.restoreAllMocks()

    const MOCK_EPOCH = 1487076708000
    jest.spyOn(Date, 'now').mockImplementation(() => MOCK_EPOCH)

    MockFormSgSdk.webhooks.generateSignature.mockReturnValueOnce(MOCK_SIGNATURE)
    const mockWebhookHeader = `t=${MOCK_EPOCH},s=${MOCK_SUBMISSION_ID},f=${MOCK_FORM_ID},v1=${MOCK_SIGNATURE}`
    MockFormSgSdk.webhooks.constructHeader.mockReturnValueOnce(
      mockWebhookHeader,
    )

    testConfig = {
      headers: {
        'X-FormSG-Signature': mockWebhookHeader,
      },
      maxRedirects: 0,
      timeout: 10000,
    }
  })

  describe('saveWebhookRecord', () => {
    it('should return transform mongo error if database update for webhook fails', async () => {
      // Arrange
      const mockWebhookResponse = {
        ...MOCK_WEBHOOK_SUCCESS_RESPONSE,
        signature: MOCK_SIGNATURE,
        webhookUrl: MOCK_WEBHOOK_URL,
      } as IWebhookResponse

      const mockDBError = new Error(DEFAULT_ERROR_MSG)

      const addWebhookResponseSpy = jest
        .spyOn(EncryptSubmissionModel, 'addWebhookResponse')
        .mockRejectedValueOnce(mockDBError)

      // Act
      const actual = await saveWebhookRecord(
        MOCK_SUBMISSION_ID,
        mockWebhookResponse,
      )

      // Assert
      const expectedError = transformMongoError(mockDBError)

      expect(addWebhookResponseSpy).toHaveBeenCalledWith(
        MOCK_SUBMISSION_ID,
        mockWebhookResponse,
      )
      expect(actual._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return submission not found error if submission id cannot be found in database', async () => {
      // Arrange
      const mockWebhookResponse = {
        ...MOCK_WEBHOOK_SUCCESS_RESPONSE,
        signature: MOCK_SIGNATURE,
        webhookUrl: MOCK_WEBHOOK_URL,
      } as IWebhookResponse

      // Act
      const actual = await saveWebhookRecord(
        new ObjectId(),
        mockWebhookResponse,
      )

      // Assert
      const expectedError = new SubmissionNotFoundError(
        'Unable to find submission ID to update webhook response',
      )

      expect(actual._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return updated submission with new webhook response if the record is successfully saved', async () => {
      // Arrange
      const mockWebhookResponse = {
        _id: MOCK_SUBMISSION_ID,
        created: new Date(),
        ...MOCK_WEBHOOK_SUCCESS_RESPONSE,
        signature: MOCK_SIGNATURE,
        webhookUrl: MOCK_WEBHOOK_URL,
      } as IWebhookResponse

      const expectedSubmission = new EncryptSubmissionModel({
        _id: MOCK_SUBMISSION_ID,
      })
      expectedSubmission.webhookResponses = [mockWebhookResponse]

      const addWebhookResponseSpy = jest
        .spyOn(EncryptSubmissionModel, 'addWebhookResponse')
        .mockResolvedValue(expectedSubmission)

      // Act
      const actual = await saveWebhookRecord(
        MOCK_SUBMISSION_ID,
        mockWebhookResponse,
      )

      // Assert
      expect(addWebhookResponseSpy).toHaveBeenCalledWith(
        MOCK_SUBMISSION_ID,
        mockWebhookResponse,
      )
      expect(actual._unsafeUnwrap()).toEqual(expectedSubmission)
    })
  })

  describe('sendWebhook', () => {
    it('should return webhook url validation error if webhook url is not valid', async () => {
      // Arrange
      MockWebhookValidationModule.validateWebhookUrl.mockRejectedValueOnce(
        new WebhookValidationError(DEFAULT_ERROR_MSG),
      )

      // Act
      const actual = await sendWebhook(MOCK_WEBHOOK_VIEW, MOCK_WEBHOOK_URL)

      // Assert
      const expectedError = new WebhookValidationError(DEFAULT_ERROR_MSG)

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(actual._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return default webhook url validation error if webhook url is not valid and validate webhook url returns a non webhook url validation error', async () => {
      // Arrange
      MockWebhookValidationModule.validateWebhookUrl.mockRejectedValueOnce(
        new Error(),
      )

      // Act
      const actual = await sendWebhook(MOCK_WEBHOOK_VIEW, MOCK_WEBHOOK_URL)

      // Assert
      const expectedError = new WebhookValidationError(
        'Webhook URL is non-HTTPS or points to private IP',
      )

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(actual._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should resolve with webhook failed with axios error message if axios post fails due to an axios error', async () => {
      // Arrange
      MockWebhookValidationModule.validateWebhookUrl.mockResolvedValueOnce()

      const MOCK_AXIOS_ERROR: AxiosError = {
        name: '',
        message: AXIOS_ERROR_MSG,
        config: {},
        code: '',
        response: MOCK_AXIOS_FAILURE_RESPONSE,
        isAxiosError: true,
        toJSON: () => jest.fn(),
      }

      MockAxios.post.mockRejectedValue(MOCK_AXIOS_ERROR)
      MockAxios.isAxiosError.mockReturnValue(true)

      // Act
      const actual = await sendWebhook(MOCK_WEBHOOK_VIEW, MOCK_WEBHOOK_URL)

      // Assert
      const expectedResult = {
        ...MOCK_WEBHOOK_FAILURE_RESPONSE,
        signature: MOCK_SIGNATURE,
        webhookUrl: MOCK_WEBHOOK_URL,
      }

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(MockAxios.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        MOCK_WEBHOOK_VIEW,
        testConfig,
      )
      expect(actual._unsafeUnwrap()).toEqual(expectedResult)
    })

    it("should resolve with unknown error's error message and default response format if axios post fails due to an unknown error", async () => {
      // Arrange
      MockWebhookValidationModule.validateWebhookUrl.mockResolvedValueOnce()

      MockAxios.post.mockRejectedValue(new Error(DEFAULT_ERROR_MSG))
      MockAxios.isAxiosError.mockReturnValue(false)

      // Act
      const actual = await sendWebhook(MOCK_WEBHOOK_VIEW, MOCK_WEBHOOK_URL)

      // Assert
      const expectedResult = {
        ...MOCK_WEBHOOK_DEFAULT_FORMAT_RESPONSE,
        signature: MOCK_SIGNATURE,
        webhookUrl: MOCK_WEBHOOK_URL,
      }

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(MockAxios.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        MOCK_WEBHOOK_VIEW,
        testConfig,
      )
      expect(actual._unsafeUnwrap()).toEqual(expectedResult)
    })

    it('should resolve with an empty error message and default response format if axios post fails due to an unknown error which has no message', async () => {
      // Arrange
      MockWebhookValidationModule.validateWebhookUrl.mockResolvedValueOnce()

      const mockOriginalError = new Error(DEFAULT_ERROR_MSG)

      MockAxios.post.mockRejectedValue(mockOriginalError)
      MockAxios.isAxiosError.mockReturnValue(false)

      // Act
      const actual = await sendWebhook(MOCK_WEBHOOK_VIEW, MOCK_WEBHOOK_URL)

      // Assert
      const expectedResult = {
        ...MOCK_WEBHOOK_DEFAULT_FORMAT_RESPONSE,
        signature: MOCK_SIGNATURE,
        webhookUrl: MOCK_WEBHOOK_URL,
      }

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(MockAxios.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        MOCK_WEBHOOK_VIEW,
        testConfig,
      )
      expect(actual._unsafeUnwrap()).toEqual(expectedResult)
    })

    it('should resolve without error message if axios post succeeds', async () => {
      // Arrange
      MockWebhookValidationModule.validateWebhookUrl.mockResolvedValueOnce()

      MockAxios.post.mockResolvedValue(MOCK_AXIOS_SUCCESS_RESPONSE)

      // Act
      const actual = await sendWebhook(MOCK_WEBHOOK_VIEW, MOCK_WEBHOOK_URL)

      // Assert
      const expectedResult = {
        ...MOCK_WEBHOOK_SUCCESS_RESPONSE,
        signature: MOCK_SIGNATURE,
        webhookUrl: MOCK_WEBHOOK_URL,
      }

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(MockAxios.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        MOCK_WEBHOOK_VIEW,
        testConfig,
      )
      expect(actual._unsafeUnwrap()).toEqual(expectedResult)
    })
  })
})
