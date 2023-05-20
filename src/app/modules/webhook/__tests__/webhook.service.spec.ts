import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ObjectId } from 'bson'
import mongoose from 'mongoose'
import { ok, okAsync } from 'neverthrow'

import formsgSdk from 'src/app/config/formsg-sdk'
import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { WebhookValidationError } from 'src/app/modules/webhook/webhook.errors'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import { transformMongoError } from 'src/app/utils/handle-mongo-error'
import { IEncryptedSubmissionSchema, WebhookView } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { WebhookResponse } from '../../../../../shared/types'
import { SubmissionNotFoundError } from '../../submission/submission.errors'
import { WebhookQueueMessage } from '../webhook.message'
import { WebhookProducer } from '../webhook.producer'
import * as WebhookService from '../webhook.service'

// define suite-wide mocks
jest.mock('axios')
const MockAxios = jest.mocked(axios)

jest.mock('src/app/modules/webhook/webhook.validation')
const MockWebhookValidationModule = jest.mocked(WebhookValidationModule)

jest.mock('src/app/config/formsg-sdk')
const MockFormSgSdk = jest.mocked(formsgSdk)

jest.mock('../webhook.message.ts')
const MockWebhookQueueMessage = jest.mocked(WebhookQueueMessage)

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
const MOCK_WEBHOOK_SUCCESS_RESPONSE: Pick<WebhookResponse, 'response'> = {
  response: {
    data: '{"result":"test-result"}',
    status: 200,
    headers: '{}',
  },
}
const MOCK_WEBHOOK_FAILURE_RESPONSE: Pick<WebhookResponse, 'response'> = {
  response: {
    data: '{"result":"test-result"}',
    status: 400,
    headers: '{}',
  },
}
const MOCK_WEBHOOK_DEFAULT_FORMAT_RESPONSE: Pick<WebhookResponse, 'response'> =
  {
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
      attachmentDownloadUrls: {
        'some-field-id': 'https://mock.s3.url/some/s3/url/timeout=3600',
      },
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
      } as WebhookResponse

      const mockDBError = new Error(DEFAULT_ERROR_MSG)

      const addWebhookResponseSpy = jest
        .spyOn(EncryptSubmissionModel, 'addWebhookResponse')
        .mockRejectedValueOnce(mockDBError)

      // Act
      const actual = await WebhookService.saveWebhookRecord(
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
      } as WebhookResponse

      // Act
      const actual = await WebhookService.saveWebhookRecord(
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
      } as WebhookResponse

      const expectedSubmission = new EncryptSubmissionModel({
        _id: MOCK_SUBMISSION_ID,
      })
      expectedSubmission.webhookResponses = [mockWebhookResponse]

      const addWebhookResponseSpy = jest
        .spyOn(EncryptSubmissionModel, 'addWebhookResponse')
        .mockResolvedValue(expectedSubmission)

      // Act
      const actual = await WebhookService.saveWebhookRecord(
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
      const actual = await WebhookService.sendWebhook(
        MOCK_WEBHOOK_VIEW,
        MOCK_WEBHOOK_URL,
      )

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
      const actual = await WebhookService.sendWebhook(
        MOCK_WEBHOOK_VIEW,
        MOCK_WEBHOOK_URL,
      )

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
      const actual = await WebhookService.sendWebhook(
        MOCK_WEBHOOK_VIEW,
        MOCK_WEBHOOK_URL,
      )

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
      const actual = await WebhookService.sendWebhook(
        MOCK_WEBHOOK_VIEW,
        MOCK_WEBHOOK_URL,
      )

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
      const actual = await WebhookService.sendWebhook(
        MOCK_WEBHOOK_VIEW,
        MOCK_WEBHOOK_URL,
      )

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
      const actual = await WebhookService.sendWebhook(
        MOCK_WEBHOOK_VIEW,
        MOCK_WEBHOOK_URL,
      )

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

  describe('createInitialWebhookSender', () => {
    // This suite only checks for correct behaviour for webhook retries,
    // since there are separate tests for sending webhooks and saving
    // responses to the database.
    let testSubmission: IEncryptedSubmissionSchema
    const MOCK_PRODUCER = {
      sendMessage: jest.fn().mockReturnValue(okAsync(true)),
    } as unknown as WebhookProducer
    beforeEach(() => {
      jest.clearAllMocks()

      testSubmission = new EncryptSubmissionModel({
        _id: MOCK_SUBMISSION_ID,
      })
      jest
        .spyOn(EncryptSubmissionModel, 'addWebhookResponse')
        .mockResolvedValue(testSubmission)
      MockWebhookValidationModule.validateWebhookUrl.mockResolvedValue()
    })

    it('should return true without retrying when webhook is successful and retries are enabled', async () => {
      MockAxios.post.mockResolvedValue(MOCK_AXIOS_SUCCESS_RESPONSE)

      const result = await WebhookService.createInitialWebhookSender(
        MOCK_PRODUCER,
      )(testSubmission, MOCK_WEBHOOK_URL, /* isRetryEnabled= */ true)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(MockWebhookQueueMessage.fromSubmissionId).not.toHaveBeenCalled()
    })

    it('should return true without retrying when webhook fails but retries are not enabled globally', async () => {
      MockAxios.post.mockResolvedValue(MOCK_AXIOS_SUCCESS_RESPONSE)

      const result = await WebhookService
        .createInitialWebhookSender
        // no producer passed to createInitialWebhookSender, so retries not enabled globally
        ()(testSubmission, MOCK_WEBHOOK_URL, true)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(MockWebhookQueueMessage.fromSubmissionId).not.toHaveBeenCalled()
    })

    it('should return true without retrying when webhook fails and retries are not enabled for form', async () => {
      MockAxios.post.mockResolvedValue(MOCK_AXIOS_FAILURE_RESPONSE)

      const result = await WebhookService
        .createInitialWebhookSender
        // no producer passed to createInitialWebhookSender, so retries not enabled globally
        ()(testSubmission, MOCK_WEBHOOK_URL, /* isRetryEnabled= */ false)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(MockWebhookQueueMessage.fromSubmissionId).not.toHaveBeenCalled()
    })

    it('should return true and retry when webhook fails and retries are enabled', async () => {
      const mockQueueMessage =
        'mockQueueMessage' as unknown as WebhookQueueMessage
      MockWebhookQueueMessage.fromSubmissionId.mockReturnValueOnce(
        ok(mockQueueMessage),
      )
      MockAxios.post.mockResolvedValue(MOCK_AXIOS_FAILURE_RESPONSE)

      const result = await WebhookService.createInitialWebhookSender(
        MOCK_PRODUCER,
      )(testSubmission, MOCK_WEBHOOK_URL, /* isRetryEnabled= */ true)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(MockWebhookQueueMessage.fromSubmissionId).toHaveBeenCalledWith(
        String(testSubmission._id),
      )
      expect(MOCK_PRODUCER.sendMessage).toHaveBeenCalledWith(mockQueueMessage)
    })
  })
})
