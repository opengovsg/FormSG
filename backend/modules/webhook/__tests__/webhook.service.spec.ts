import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ObjectID } from 'bson'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import formsgSdk from 'src/app/config/formsg-sdk'
import getFormModel from 'src/app/models/form.server.model'
import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { WebhookValidationError } from 'src/app/modules/webhook/webhook.errors'
import * as WebhookValidationModule from 'src/app/modules/webhook/webhook.validation'
import { transformMongoError } from 'src/app/utils/handle-mongo-error'
import {
  IEncryptedSubmissionSchema,
  IWebhookResponse,
  ResponseMode,
  WebhookView,
} from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { SubmissionNotFoundError } from '../../submission/submission.errors'
import { saveWebhookRecord, sendWebhook } from '../webhook.service'

// define suite-wide mocks
jest.mock('axios')
const MockAxios = mocked(axios, true)

jest.mock('src/app/modules/webhook/webhook.validation')
const MockWebhookValidationModule = mocked(WebhookValidationModule, true)

// define test constants
const FormModel = getFormModel(mongoose)
const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

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
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    await dbHandler.clearDatabase()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  // test variables
  let testEncryptedSubmission: IEncryptedSubmissionSchema
  let testConfig: AxiosRequestConfig
  let testSubmissionWebhookView: WebhookView | null
  let testSignature: string

  beforeEach(async () => {
    jest.restoreAllMocks()

    // prepare for form creation workflow
    const MOCK_ADMIN_OBJ_ID = new ObjectID()
    const MOCK_EPOCH = 1487076708000
    const preloaded = await dbHandler.insertFormCollectionReqs({
      userId: MOCK_ADMIN_OBJ_ID,
    })

    jest.spyOn(Date, 'now').mockImplementation(() => MOCK_EPOCH)

    // instantiate new form and save
    const testEncryptedForm = await FormModel.create({
      title: 'Test Form',
      admin: preloaded.user._id,
      responseMode: ResponseMode.Encrypt,
      publicKey: 'fake-public-key',
    })

    // initialise encrypted submussion
    testEncryptedSubmission = await EncryptSubmissionModel.create({
      form: testEncryptedForm._id,
      authType: testEncryptedForm.authType,
      myInfoFields: [],
      encryptedContent: 'encrypted-content',
      verifiedContent: 'verified-content',
      version: 1,
      webhookResponses: [],
    })

    // initialise webhook related variables
    testSubmissionWebhookView = testEncryptedSubmission.getWebhookView()

    testSignature = formsgSdk.webhooks.generateSignature({
      uri: MOCK_WEBHOOK_URL,
      submissionId: testEncryptedSubmission._id,
      formId: testEncryptedForm._id,
      epoch: MOCK_EPOCH,
    })

    testConfig = {
      headers: {
        'X-FormSG-Signature': `t=${MOCK_EPOCH},s=${testEncryptedSubmission._id},f=${testEncryptedForm._id},v1=${testSignature}`,
      },
      maxRedirects: 0,
    }
  })

  describe('saveWebhookRecord', () => {
    it('should return transform mongo error if database update for webhook fails', async () => {
      // Arrange
      const mockWebhookResponse = {
        ...MOCK_WEBHOOK_SUCCESS_RESPONSE,
        signature: testSignature,
        webhookUrl: MOCK_WEBHOOK_URL,
      } as IWebhookResponse

      const mockDBError = new Error(DEFAULT_ERROR_MSG)

      const addWebhookResponseSpy = jest
        .spyOn(EncryptSubmissionModel, 'addWebhookResponse')
        .mockRejectedValueOnce(mockDBError)

      // Act
      const actual = await saveWebhookRecord(
        testEncryptedSubmission._id,
        mockWebhookResponse,
      )

      // Assert
      const expectedError = transformMongoError(mockDBError)

      expect(addWebhookResponseSpy).toHaveBeenCalledWith(
        testEncryptedSubmission._id,
        mockWebhookResponse,
      )
      expect(actual._unsafeUnwrapErr()).toEqual(expectedError)
    })

    it('should return submission not found error if submission id cannot be found in database', async () => {
      // Arrange
      const mockWebhookResponse = {
        ...MOCK_WEBHOOK_SUCCESS_RESPONSE,
        signature: testSignature,
        webhookUrl: MOCK_WEBHOOK_URL,
      } as IWebhookResponse

      // Act
      const actual = await saveWebhookRecord(
        new ObjectID(),
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
        _id: testEncryptedSubmission._id,
        created: testEncryptedSubmission.created,
        ...MOCK_WEBHOOK_SUCCESS_RESPONSE,
        signature: testSignature,
        webhookUrl: MOCK_WEBHOOK_URL,
      } as IWebhookResponse

      const expectedSubmission = new EncryptSubmissionModel({
        ...testEncryptedSubmission,
      })
      expectedSubmission.webhookResponses = [mockWebhookResponse]

      const addWebhookResponseSpy = jest
        .spyOn(EncryptSubmissionModel, 'addWebhookResponse')
        .mockResolvedValue(expectedSubmission)

      // Act
      const actual = await saveWebhookRecord(
        testEncryptedSubmission._id,
        mockWebhookResponse,
      )

      // Assert
      expect(addWebhookResponseSpy).toHaveBeenCalledWith(
        testEncryptedSubmission._id,
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
      const actual = await sendWebhook(
        testEncryptedSubmission,
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
      const actual = await sendWebhook(
        testEncryptedSubmission,
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

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      MockAxios.post.mockRejectedValue(MOCK_AXIOS_ERROR)
      MockAxios.isAxiosError.mockReturnValue(true)

      // Act
      const actual = await sendWebhook(
        testEncryptedSubmission,
        MOCK_WEBHOOK_URL,
      )

      // Assert
      const expectedResult = {
        ...MOCK_WEBHOOK_FAILURE_RESPONSE,
        signature: testSignature,
        webhookUrl: MOCK_WEBHOOK_URL,
      }

      expect(MockAxios.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        testSubmissionWebhookView,
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
      const actual = await sendWebhook(
        testEncryptedSubmission,
        MOCK_WEBHOOK_URL,
      )

      // Assert
      const expectedResult = {
        ...MOCK_WEBHOOK_DEFAULT_FORMAT_RESPONSE,
        signature: testSignature,
        webhookUrl: MOCK_WEBHOOK_URL,
      }

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(MockAxios.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        testSubmissionWebhookView,
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
      const actual = await sendWebhook(
        testEncryptedSubmission,
        MOCK_WEBHOOK_URL,
      )

      // Assert
      const expectedResult = {
        ...MOCK_WEBHOOK_DEFAULT_FORMAT_RESPONSE,
        signature: testSignature,
        webhookUrl: MOCK_WEBHOOK_URL,
      }

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(MockAxios.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        testSubmissionWebhookView,
        testConfig,
      )
      expect(actual._unsafeUnwrap()).toEqual(expectedResult)
    })

    it('should resolve without error message if axios post succeeds', async () => {
      // Arrange
      MockWebhookValidationModule.validateWebhookUrl.mockResolvedValueOnce()

      MockAxios.post.mockResolvedValue(MOCK_AXIOS_SUCCESS_RESPONSE)

      // Act
      const actual = await sendWebhook(
        testEncryptedSubmission,
        MOCK_WEBHOOK_URL,
      )

      // Assert
      const expectedResult = {
        ...MOCK_WEBHOOK_SUCCESS_RESPONSE,
        signature: testSignature,
        webhookUrl: MOCK_WEBHOOK_URL,
      }

      expect(
        MockWebhookValidationModule.validateWebhookUrl,
      ).toHaveBeenCalledWith(MOCK_WEBHOOK_URL)
      expect(MockAxios.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        testSubmissionWebhookView,
        testConfig,
      )
      expect(actual._unsafeUnwrap()).toEqual(expectedResult)
    })
  })
})
