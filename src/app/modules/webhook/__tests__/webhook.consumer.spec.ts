import aws from 'aws-sdk'
import { ObjectId } from 'bson'
import { addHours } from 'date-fns'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'

import { getEncryptSubmissionModel } from 'src/app/models/submission.server.model'
import { SubmissionWebhookInfo } from 'src/types'

import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { WebhookResponse } from '../../../../../shared/types'
import { createWebhookQueueHandler } from '../webhook.consumer'
import { WebhookPushToQueueError } from '../webhook.errors'
import { WebhookProducer } from '../webhook.producer'
import * as WebhookService from '../webhook.service'
import { WebhookQueueMessageObject } from '../webhook.types'

jest.mock('../webhook.service')
const MockWebhookService = jest.mocked(WebhookService)

const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

const MOCK_WEBHOOK_SUCCESS_RESPONSE: WebhookResponse = {
  signature: 'mockSignature',
  webhookUrl: 'mockWebhookUrl',
  response: {
    data: 'mockData',
    headers: 'mockHeaders',
    status: 200,
  },
}
const MOCK_WEBHOOK_FAILURE_RESPONSE: WebhookResponse = {
  signature: 'mockSignature',
  webhookUrl: 'mockWebhookUrl',
  response: {
    data: 'mockData',
    headers: 'mockHeaders',
    status: 400,
  },
}

const SUCCESS_PRODUCER = {
  sendMessage: jest.fn().mockReturnValue(okAsync(true)),
} as unknown as WebhookProducer

const FAILURE_PRODUCER = {
  sendMessage: jest
    .fn()
    .mockReturnValue(errAsync(new WebhookPushToQueueError())),
} as unknown as WebhookProducer

const VALID_MESSAGE_BODY: WebhookQueueMessageObject = {
  submissionId: new ObjectId().toHexString(),
  previousAttempts: [Date.now()],
  nextAttempt: Date.now(),
  _v: 0,
}

const VALID_SQS_MESSAGE: aws.SQS.Message = {
  Body: JSON.stringify(VALID_MESSAGE_BODY),
}

const MOCK_WEBHOOK_INFO = {
  isRetryEnabled: true,
  webhookUrl: 'some url',
  webhookView: {
    data: {
      submissionId: VALID_MESSAGE_BODY.submissionId,
    },
  },
} as SubmissionWebhookInfo

describe('webhook.consumer', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('createWebhookQueueHandler', () => {
    it('should reject when message body is undefined', async () => {
      const result = createWebhookQueueHandler(SUCCESS_PRODUCER)({})

      await expect(result).toReject()
    })

    it('should reject when message body cannot be parsed', async () => {
      const result = createWebhookQueueHandler(SUCCESS_PRODUCER)({
        Body: 'yoooooooooooo',
      })

      await expect(result).toReject()
    })

    it('should requeue webhook when it is not due', async () => {
      const message = {
        Body: JSON.stringify({
          ...VALID_MESSAGE_BODY,
          // next attempt in the future
          nextAttempt: addHours(Date.now(), 1).getTime(),
        }),
      }

      await expect(
        createWebhookQueueHandler(SUCCESS_PRODUCER)(message),
      ).toResolve()
      expect(MockWebhookService.sendWebhook).not.toHaveBeenCalled()
      expect(MockWebhookService.saveWebhookRecord).not.toHaveBeenCalled()
      expect(SUCCESS_PRODUCER.sendMessage).toHaveBeenCalled()
    })

    it('should reject when it fails to requeue webhook which is not due', async () => {
      const message = {
        Body: JSON.stringify({
          ...VALID_MESSAGE_BODY,
          // next attempt in the future
          nextAttempt: addHours(Date.now(), 1).getTime(),
        }),
      }

      await expect(
        createWebhookQueueHandler(FAILURE_PRODUCER)(message),
      ).toReject()
      expect(MockWebhookService.sendWebhook).not.toHaveBeenCalled()
      expect(MockWebhookService.saveWebhookRecord).not.toHaveBeenCalled()
      expect(FAILURE_PRODUCER.sendMessage).toHaveBeenCalled()
    })

    it('should reject when submission ID cannot be found', async () => {
      jest
        .spyOn(EncryptSubmissionModel, 'retrieveWebhookInfoById')
        .mockResolvedValueOnce(null)

      await expect(
        createWebhookQueueHandler(SUCCESS_PRODUCER)(VALID_SQS_MESSAGE),
      ).toReject()
      expect(MockWebhookService.sendWebhook).not.toHaveBeenCalled()
      expect(MockWebhookService.saveWebhookRecord).not.toHaveBeenCalled()
      expect(SUCCESS_PRODUCER.sendMessage).not.toHaveBeenCalled()
    })

    it('should reject when database error occurs', async () => {
      jest
        .spyOn(EncryptSubmissionModel, 'retrieveWebhookInfoById')
        .mockRejectedValueOnce(new Error(''))

      await expect(
        createWebhookQueueHandler(SUCCESS_PRODUCER)(VALID_SQS_MESSAGE),
      ).toReject()
      expect(MockWebhookService.sendWebhook).not.toHaveBeenCalled()
      expect(MockWebhookService.saveWebhookRecord).not.toHaveBeenCalled()
      expect(SUCCESS_PRODUCER.sendMessage).not.toHaveBeenCalled()
    })

    it('should resolve when form has no webhook URL', async () => {
      jest
        .spyOn(EncryptSubmissionModel, 'retrieveWebhookInfoById')
        .mockResolvedValueOnce({
          ...MOCK_WEBHOOK_INFO,
          webhookUrl: '',
        })

      await expect(
        createWebhookQueueHandler(SUCCESS_PRODUCER)(VALID_SQS_MESSAGE),
      ).toResolve()
      expect(MockWebhookService.sendWebhook).not.toHaveBeenCalled()
      expect(MockWebhookService.saveWebhookRecord).not.toHaveBeenCalled()
      expect(SUCCESS_PRODUCER.sendMessage).not.toHaveBeenCalled()
    })

    it('should resolve when form does not have retries enabled', async () => {
      jest
        .spyOn(EncryptSubmissionModel, 'retrieveWebhookInfoById')
        .mockResolvedValueOnce({
          ...MOCK_WEBHOOK_INFO,
          isRetryEnabled: false,
        })

      await expect(
        createWebhookQueueHandler(SUCCESS_PRODUCER)(VALID_SQS_MESSAGE),
      ).toResolve()
      expect(MockWebhookService.sendWebhook).not.toHaveBeenCalled()
      expect(MockWebhookService.saveWebhookRecord).not.toHaveBeenCalled()
      expect(SUCCESS_PRODUCER.sendMessage).not.toHaveBeenCalled()
    })

    it('should resolve without requeuing when webhook succeeds', async () => {
      jest
        .spyOn(EncryptSubmissionModel, 'retrieveWebhookInfoById')
        .mockResolvedValueOnce(MOCK_WEBHOOK_INFO)
      MockWebhookService.sendWebhook.mockReturnValueOnce(
        okAsync(MOCK_WEBHOOK_SUCCESS_RESPONSE),
      )

      await expect(
        createWebhookQueueHandler(SUCCESS_PRODUCER)(VALID_SQS_MESSAGE),
      ).toResolve()
      expect(MockWebhookService.sendWebhook).toHaveBeenCalledWith(
        MOCK_WEBHOOK_INFO.webhookView,
        MOCK_WEBHOOK_INFO.webhookUrl,
      )
      expect(MockWebhookService.saveWebhookRecord).toHaveBeenCalledWith(
        VALID_MESSAGE_BODY.submissionId,
        MOCK_WEBHOOK_SUCCESS_RESPONSE,
      )
      expect(SUCCESS_PRODUCER.sendMessage).not.toHaveBeenCalled()
    })

    it('should requeue webhook when retry fails and there are retries remaining', async () => {
      jest
        .spyOn(EncryptSubmissionModel, 'retrieveWebhookInfoById')
        .mockResolvedValueOnce(MOCK_WEBHOOK_INFO)
      MockWebhookService.sendWebhook.mockReturnValueOnce(
        // note failure response instead of success
        okAsync(MOCK_WEBHOOK_FAILURE_RESPONSE),
      )

      await expect(
        createWebhookQueueHandler(SUCCESS_PRODUCER)(VALID_SQS_MESSAGE),
      ).toResolve()
      expect(MockWebhookService.sendWebhook).toHaveBeenCalledWith(
        MOCK_WEBHOOK_INFO.webhookView,
        MOCK_WEBHOOK_INFO.webhookUrl,
      )
      expect(MockWebhookService.saveWebhookRecord).toHaveBeenCalledWith(
        VALID_MESSAGE_BODY.submissionId,
        MOCK_WEBHOOK_FAILURE_RESPONSE,
      )
      expect(SUCCESS_PRODUCER.sendMessage).toHaveBeenCalled()
    })

    it('should resolve without requeuing when retry fails and there are no retries remaining', async () => {
      jest
        .spyOn(EncryptSubmissionModel, 'retrieveWebhookInfoById')
        .mockResolvedValueOnce(MOCK_WEBHOOK_INFO)
      MockWebhookService.sendWebhook.mockReturnValueOnce(
        okAsync(MOCK_WEBHOOK_SUCCESS_RESPONSE),
      )
      const message = {
        Body: JSON.stringify({
          ...VALID_MESSAGE_BODY,
          // length greater than max possible number of retries
          previousAttempts: Array(10).fill(0),
        }),
      }

      await expect(
        createWebhookQueueHandler(SUCCESS_PRODUCER)(message),
      ).toResolve()
      expect(MockWebhookService.sendWebhook).toHaveBeenCalledWith(
        MOCK_WEBHOOK_INFO.webhookView,
        MOCK_WEBHOOK_INFO.webhookUrl,
      )
      expect(MockWebhookService.saveWebhookRecord).toHaveBeenCalledWith(
        VALID_MESSAGE_BODY.submissionId,
        MOCK_WEBHOOK_SUCCESS_RESPONSE,
      )
      expect(SUCCESS_PRODUCER.sendMessage).not.toHaveBeenCalled()
    })

    it('should reject when retry fails and subsequently fails to be requeued', async () => {
      jest
        .spyOn(EncryptSubmissionModel, 'retrieveWebhookInfoById')
        .mockResolvedValueOnce(MOCK_WEBHOOK_INFO)
      MockWebhookService.sendWebhook.mockReturnValueOnce(
        okAsync(MOCK_WEBHOOK_FAILURE_RESPONSE),
      )

      await expect(
        createWebhookQueueHandler(FAILURE_PRODUCER)(VALID_SQS_MESSAGE),
      ).toReject()
      expect(MockWebhookService.sendWebhook).toHaveBeenCalledWith(
        MOCK_WEBHOOK_INFO.webhookView,
        MOCK_WEBHOOK_INFO.webhookUrl,
      )
      expect(MockWebhookService.saveWebhookRecord).toHaveBeenCalledWith(
        VALID_MESSAGE_BODY.submissionId,
        MOCK_WEBHOOK_FAILURE_RESPONSE,
      )
      expect(FAILURE_PRODUCER.sendMessage).toHaveBeenCalled()
    })
  })
})
