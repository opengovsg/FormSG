import axios, { AxiosError } from 'axios'
import { ObjectID } from 'bson'
import mongoose from 'mongoose'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { getEncryptedFormModel } from 'src/app/models/form.server.model'
import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import {
  handleWebhookFailure,
  handleWebhookSuccess,
  postWebhook,
} from 'src/app/services/webhooks.service'
import { WebhookValidationError } from 'src/app/utils/custom-errors'
import { ResponseMode, SubmissionType } from 'src/types'

const EncryptForm = getEncryptedFormModel(mongoose)
const EncryptSubmission = getEncryptSubmissionModel(mongoose)

describe('WebhooksService', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  let testEncryptForm
  let testEncryptSubmission
  let testWebhookParam
  let testConfig
  let testSubmissionWebhookView
  const MOCK_ADMIN_OBJ_ID = new ObjectID()
  const MOCK_SIGNATURE = 'mock-signature'
  const MOCK_WEBHOOK_URL = '/webhook-endpoint'
  const MOCK_NOW = Date.now()
  const ERROR_MSG = 'test-message'
  const MOCK_SUCCESS_RESPONSE = {
    data: {
      result: 'test-result',
    },
    status: 200,
    statusText: 'success',
    headers: {},
    config: {},
  }
  const MOCK_STRINGIFIED_PARSED_RESPONSE = {
    data: '{"result":"test-result"}',
    status: 200,
    statusText: 'success',
    headers: '{}',
  }

  beforeEach(async () => {
    const preloaded = await dbHandler.insertFormCollectionReqs({
      userId: MOCK_ADMIN_OBJ_ID,
    })
    testEncryptForm = await EncryptForm.create({
      title: 'Test Form',
      admin: preloaded.user._id,
      responseMode: ResponseMode.Encrypt,
      publicKey: 'fake-public-key',
    })
    testEncryptSubmission = await EncryptSubmission.create({
      form: testEncryptForm._id,
      submissionType: SubmissionType.Encrypt,
      encryptedContent: 'encrypted-content',
      verifiedContent: 'verified-content',
      version: 1,
      authType: testEncryptForm.authType,
      myInfoFields: [],
      webhookResponses: [],
    })

    testSubmissionWebhookView = testEncryptSubmission.getWebhookView()
    testWebhookParam = {
      webhookUrl: MOCK_WEBHOOK_URL,
      submissionWebhookView: testSubmissionWebhookView,
      submissionId: testEncryptSubmission._id,
      formId: testEncryptForm._id,
      now: MOCK_NOW,
      signature: MOCK_SIGNATURE,
    }
    testConfig = {
      headers: {
        'X-FormSG-Signature': `t=${MOCK_NOW},s=${testEncryptSubmission._id},f=${testEncryptForm._id},v1=${MOCK_SIGNATURE}`,
      },
      maxRedirects: 0,
    }
  })

  describe('handleWebhookFailure', () => {
    it('should update submission document with failed webhook response', async () => {
      // Act
      class MockAxiosError extends Error {
        response: any
        isAxiosError: boolean
        toJSON: () => {}
        config: object
        constructor(msg, response) {
          super(msg)
          this.name = 'AxiosError'
          this.response = response
          this.isAxiosError = false
          this.toJSON = () => {
            return {}
          }
          this.config = {}
        }
      }
      let error: AxiosError = new MockAxiosError(
        ERROR_MSG,
        MOCK_SUCCESS_RESPONSE,
      )
      await handleWebhookFailure(error, testWebhookParam)
      // Assert
      let submission = await EncryptSubmission.findById(
        testEncryptSubmission._id,
      )
      expect(submission.webhookResponses[0]).toEqual(
        expect.objectContaining({
          webhookUrl: MOCK_WEBHOOK_URL,
          signature: MOCK_SIGNATURE,
          errorMessage: ERROR_MSG,
          response: expect.objectContaining(MOCK_STRINGIFIED_PARSED_RESPONSE),
        }),
      )
    })
    it('should update submission document with failed webhook validation', async () => {
      // Act
      const error = new WebhookValidationError(ERROR_MSG)
      await handleWebhookFailure(error, testWebhookParam)
      // Assert
      let submission = await EncryptSubmission.findById(
        testEncryptSubmission._id,
      )
      expect(submission.webhookResponses[0]).toEqual(
        expect.objectContaining({
          webhookUrl: MOCK_WEBHOOK_URL,
          signature: MOCK_SIGNATURE,
          errorMessage: ERROR_MSG,
        }),
      )
    })
  })

  describe('handleWebhookSuccess', () => {
    it('should update submission document with successful webhook response', async () => {
      // Act
      await handleWebhookSuccess(MOCK_SUCCESS_RESPONSE, testWebhookParam)
      // Assert
      let submission = await EncryptSubmission.findById(
        testEncryptSubmission._id,
      )
      expect(submission.webhookResponses[0]).toEqual(
        expect.objectContaining({
          webhookUrl: MOCK_WEBHOOK_URL,
          signature: MOCK_SIGNATURE,
          response: expect.objectContaining(MOCK_STRINGIFIED_PARSED_RESPONSE),
        }),
      )
    })
  })

  describe('postWebhook', () => {
    it('should make post request with valid parameters', async () => {
      // Arrange
      const spyAxios = spyOn(axios, 'post')
      // Act and Assert
      spyAxios.and.callFake((url, data, config) => {
        expect(url).toEqual(MOCK_WEBHOOK_URL)
        expect(data).toEqual(testSubmissionWebhookView)
        expect(config).toEqual(testConfig)
        return MOCK_SUCCESS_RESPONSE
      })
      const response = await postWebhook(testWebhookParam)
      expect(response).toEqual(MOCK_SUCCESS_RESPONSE)
    })
  })
})
