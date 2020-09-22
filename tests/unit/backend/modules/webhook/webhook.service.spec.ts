import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ObjectID } from 'bson'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { mocked } from 'ts-jest/utils'

import getFormModel from 'src/app/models/form.server.model'
import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { WebhookValidationError } from 'src/app/modules/webhook/webhook.errors'
import { pushData } from 'src/app/modules/webhook/webhook.service'
import { validateWebhookUrl } from 'src/app/modules/webhook/webhook.utils'
import formsgSdk from 'src/config/formsg-sdk'
import {
  IEncryptedSubmissionSchema,
  IWebhookResponse,
  ResponseMode,
  WebhookView,
} from 'src/types'

const Form = getFormModel(mongoose)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

// Define constants
const MOCK_ADMIN_OBJ_ID = new ObjectID()
const MOCK_WEBHOOK_URL: string = 'https://form.gov.sg/endpoint'
const ERROR_MSG: string = 'test-message'
const MOCK_SUCCESS_RESPONSE: AxiosResponse = {
  data: {
    result: 'test-result',
  },
  status: 200,
  statusText: 'success',
  headers: {},
  config: {},
}
const MOCK_FAILURE_RESPONSE: AxiosResponse = {
  data: {
    result: 'test-result',
  },
  status: 400,
  statusText: 'failed',
  headers: {},
  config: {},
}
const MOCK_STRINGIFIED_SUCCESS_RESPONSE: Pick<IWebhookResponse, 'response'> = {
  response: {
    data: '{"result":"test-result"}',
    status: 200,
    statusText: 'success',
    headers: '{}',
  },
}
const MOCK_STRINGIFIED_FAILURE_RESPONSE: Pick<IWebhookResponse, 'response'> = {
  response: {
    data: `{"result":"test-result"}`,
    status: 400,
    statusText: 'failed',
    headers: '{}',
  },
}
const MOCK_EPOCH: number = 1487076708000

// Set up mocks
jest.mock('axios')
const mockAxios = mocked(axios, true)
jest.mock('src/app/modules/webhook/webhook.utils')
const mockValidateWebhookUrl = mocked(validateWebhookUrl, true)
jest.spyOn(Date, 'now').mockImplementation(() => MOCK_EPOCH)

describe('WebhooksService', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => {
    await dbHandler.clearDatabase()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  let testEncryptSubmission: IEncryptedSubmissionSchema
  let testConfig: AxiosRequestConfig
  let testSubmissionWebhookView: WebhookView | null
  let testSignature: string

  beforeEach(async () => {
    const preloaded = await dbHandler.insertFormCollectionReqs({
      userId: MOCK_ADMIN_OBJ_ID,
    })
    let testEncryptForm = new Form({
      title: 'Test Form',
      admin: preloaded.user._id,
      responseMode: ResponseMode.Encrypt,
      publicKey: 'fake-public-key',
    })
    await testEncryptForm.save()

    testEncryptSubmission = new EncryptSubmission({
      form: testEncryptForm._id,
      authType: testEncryptForm.authType,
      myInfoFields: [],
      encryptedContent: 'encrypted-content',
      verifiedContent: 'verified-content',
      version: 1,
    })
    await testEncryptSubmission.save()

    testSubmissionWebhookView = testEncryptSubmission.getWebhookView()

    testSignature = formsgSdk.webhooks.generateSignature({
      uri: MOCK_WEBHOOK_URL,
      submissionId: testEncryptSubmission._id,
      formId: testEncryptForm._id,
      epoch: MOCK_EPOCH,
    }) as string

    testConfig = {
      headers: {
        'X-FormSG-Signature': `t=${MOCK_EPOCH},s=${testEncryptSubmission._id},f=${testEncryptForm._id},v1=${testSignature}`,
      },
      maxRedirects: 0,
    }
  })

  describe('postWebhook', () => {
    it('should not make post request if submissionWebhookView is null', async () => {
      // Act
      await pushData(MOCK_WEBHOOK_URL, null)

      // Assert
      expect(mockAxios.post).toHaveBeenCalledTimes(0)
    })

    it('should update submission document with successful webhook response if post succeeds', async () => {
      // Arrange
      mockAxios.post.mockImplementationOnce((url, data, config) => {
        expect(url).toEqual(MOCK_WEBHOOK_URL)
        expect(data).toEqual(testSubmissionWebhookView)
        expect(config).toEqual(testConfig)
        return Promise.resolve(MOCK_SUCCESS_RESPONSE)
      })
      mockValidateWebhookUrl.mockImplementationOnce((url) => {
        expect(url).toEqual(MOCK_WEBHOOK_URL)
        return Promise.resolve()
      })

      // Act
      await pushData(MOCK_WEBHOOK_URL, testSubmissionWebhookView)

      // Assert
      let submission = await EncryptSubmission.findById(
        testEncryptSubmission._id,
      )
      expect(submission!.webhookResponses[0]).toEqual(
        expect.objectContaining({
          webhookUrl: MOCK_WEBHOOK_URL,
          signature: testSignature,
          response: expect.objectContaining(
            MOCK_STRINGIFIED_SUCCESS_RESPONSE.response,
          ),
        }),
      )
    })

    it('should update submission document with failed webhook response if validation fails', async () => {
      // Arrange
      mockValidateWebhookUrl.mockImplementationOnce((url) => {
        expect(url).toEqual(MOCK_WEBHOOK_URL)
        return Promise.reject(new WebhookValidationError(ERROR_MSG))
      })

      // Act
      await pushData(MOCK_WEBHOOK_URL, testSubmissionWebhookView)

      // Assert
      let submission = await EncryptSubmission.findById(
        testEncryptSubmission._id,
      )
      expect(submission!.webhookResponses[0]).toEqual(
        expect.objectContaining({
          webhookUrl: MOCK_WEBHOOK_URL,
          signature: testSignature,
          errorMessage: ERROR_MSG,
        }),
      )
    })

    it('should update submission document with failed webhook response if post fails', async () => {
      // Arrange
      class MockAxiosError extends Error {
        isAxiosError: boolean
        toJSON: () => {}
        config: object
        response: AxiosResponse
        constructor(msg: string, response: AxiosResponse) {
          super(msg)
          this.isAxiosError = false
          this.response = response
          this.toJSON = () => {
            return {}
          }
          this.config = {}
        }
      }
      let mockAxiosError: AxiosError = new MockAxiosError(
        ERROR_MSG,
        MOCK_FAILURE_RESPONSE,
      )
      mockAxios.post.mockImplementationOnce((url, data, config) => {
        expect(url).toEqual(MOCK_WEBHOOK_URL)
        expect(data).toEqual(testSubmissionWebhookView)
        expect(config).toEqual(testConfig)
        return Promise.reject(mockAxiosError)
      })
      mockValidateWebhookUrl.mockImplementationOnce((url) => {
        expect(url).toEqual(MOCK_WEBHOOK_URL)
        return Promise.resolve()
      })

      // Act
      await pushData(MOCK_WEBHOOK_URL, testSubmissionWebhookView)

      // Assert
      let submission = await EncryptSubmission.findById(
        testEncryptSubmission._id,
      )
      expect(submission!.webhookResponses[0]).toEqual(
        expect.objectContaining({
          webhookUrl: MOCK_WEBHOOK_URL,
          signature: testSignature,
          errorMessage: ERROR_MSG,
          response: expect.objectContaining(
            MOCK_STRINGIFIED_FAILURE_RESPONSE.response,
          ),
        }),
      )
    })
  })
})
