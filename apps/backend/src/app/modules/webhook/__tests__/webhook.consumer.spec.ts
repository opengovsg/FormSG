import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { Message } from '@aws-sdk/client-sqs'
import { ObjectId } from 'bson'
import { addHours } from 'date-fns'
import { WebhookResponse } from 'formsg-shared/types'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'

import getSubmissionModel from 'src/app/models/submission.server.model'
import {
  SnapshotAccessDeniedError,
  SnapshotDataIntegrityError,
  SnapshotFormatNotRecordedError,
  SnapshotReadError,
} from 'src/app/modules/submission/multirespondent-submission/webhook/submission-snapshot.errors'
import { SubmissionSnapshotV4 } from 'src/app/modules/submission/multirespondent-submission/webhook/submission-snapshot.schema'
import * as SnapshotStore from 'src/app/modules/submission/multirespondent-submission/webhook/submission-snapshot.store'
import { SubmissionWebhookInfo } from 'src/types'

import { QUEUE_MESSAGE_VERSION } from '../webhook.constants'
import { createWebhookQueueHandler } from '../webhook.consumer'
import { WebhookPushToQueueError } from '../webhook.errors'
import { WebhookProducer } from '../webhook.producer'
import * as WebhookService from '../webhook.service'
import { WebhookQueueMessageObject } from '../webhook.types'

jest.mock('../webhook.service')
const MockWebhookService = jest.mocked(WebhookService)

jest.mock(
  'src/app/modules/submission/multirespondent-submission/webhook/submission-snapshot.store',
)
const MockSnapshotStore = jest.mocked(SnapshotStore)

const SubmissionModel = getSubmissionModel(mongoose)

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

let SUCCESS_PRODUCER: WebhookProducer
let FAILURE_PRODUCER: WebhookProducer

const VALID_MESSAGE_BODY: WebhookQueueMessageObject = {
  submissionId: new ObjectId().toHexString(),
  previousAttempts: [Date.now()],
  nextAttempt: Date.now(),
  _v: 0,
}

const VALID_SQS_MESSAGE: Message = {
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

const MOCK_FORM_ID = new ObjectId().toHexString()

/**
 * An MRF row that has advanced past the step a retry is redelivering: its
 * content is the LATEST step's, so anything the retry ships from the live row
 * is immediately visible.
 */
const MOCK_MRF_WEBHOOK_INFO = {
  isRetryEnabled: true,
  webhookUrl: 'https://plumber.gov.sg/webhooks/retry',
  webhookView: {
    data: {
      formId: MOCK_FORM_ID,
      submissionId: VALID_MESSAGE_BODY.submissionId,
      encryptedContent: 'latest-step-encrypted-content',
      version: 4,
      created: new Date('2026-07-22T00:00:00.000Z'),
      attachmentDownloadUrls: {},
      paymentContent: {},
      workflowContent: {
        workflow: [],
        workflowStep: 1,
        submittedSteps: [
          { isApproval: false, submittedAt: '2026-07-22T00:00:00.000Z' },
          { isApproval: false, submittedAt: '2026-07-22T01:00:00.000Z' },
        ],
      },
    },
  },
  snapshotTokens: [{ v4: 'tok-step-0' }, { v4: 'tok-step-1' }],
} as SubmissionWebhookInfo

const MOCK_SNAPSHOT: SubmissionSnapshotV4 = {
  _v: 1,
  contentFormat: 'v4',
  formId: MOCK_FORM_ID,
  submissionId: VALID_MESSAGE_BODY.submissionId,
  submissionIndex: 0,
  workflowStep: 0,
  encryptedContent: 'frozen-step-0-encrypted-content',
  encryptedSubmissionSecretKey: 'wrapped-read-key',
  createdAt: '2026-07-22T00:00:00.000Z',
}

describe('webhook.consumer', () => {
  beforeAll(async () => await dbHandler.connect())
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()

    SUCCESS_PRODUCER = {
      sendMessage: jest.fn().mockReturnValue(okAsync(true)),
    } as unknown as WebhookProducer

    FAILURE_PRODUCER = {
      sendMessage: jest
        .fn()
        .mockReturnValue(errAsync(new WebhookPushToQueueError())),
    } as unknown as WebhookProducer
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
        .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
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
        .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
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
        .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
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
        .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
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
        .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
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
        .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
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
        .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
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
        .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
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

    describe('snapshot replay', () => {
      const SNAPSHOT_MESSAGE_BODY: WebhookQueueMessageObject = {
        submissionId: VALID_MESSAGE_BODY.submissionId,
        submissionIndex: 0,
        contentFormat: 'v4',
        previousAttempts: [Date.now()],
        nextAttempt: Date.now(),
        _v: QUEUE_MESSAGE_VERSION,
      }
      const SNAPSHOT_SQS_MESSAGE: Message = {
        Body: JSON.stringify(SNAPSHOT_MESSAGE_BODY),
      }

      beforeEach(() => {
        jest
          .spyOn(SubmissionModel, 'retrieveWebhookInfoById')
          .mockResolvedValue(MOCK_MRF_WEBHOOK_INFO)
        MockWebhookService.sendWebhook.mockReturnValue(
          okAsync(MOCK_WEBHOOK_SUCCESS_RESPONSE),
        )
      })

      it('should redeliver the frozen step submission, not the live row, for a snapshot message', async () => {
        MockSnapshotStore.readV4Snapshot.mockReturnValue(okAsync(MOCK_SNAPSHOT))

        await expect(
          createWebhookQueueHandler(SUCCESS_PRODUCER)(SNAPSHOT_SQS_MESSAGE),
        ).toResolve()

        expect(MockSnapshotStore.readV4Snapshot).toHaveBeenCalledWith(
          expect.objectContaining({
            submissionIndex: 0,
            token: 'tok-step-0',
          }),
        )
        const [sentView] = MockWebhookService.sendWebhook.mock.calls[0]
        expect(sentView.data.encryptedContent).toBe(
          MOCK_SNAPSHOT.encryptedContent,
        )
      })

      it('should redeliver from the live row for an in-flight legacy message', async () => {
        await expect(
          createWebhookQueueHandler(SUCCESS_PRODUCER)(VALID_SQS_MESSAGE),
        ).toResolve()

        expect(MockSnapshotStore.readV4Snapshot).not.toHaveBeenCalled()
        expect(MockWebhookService.sendWebhook).toHaveBeenCalledWith(
          MOCK_MRF_WEBHOOK_INFO.webhookView,
          MOCK_MRF_WEBHOOK_INFO.webhookUrl,
        )
      })

      it.each([
        ['a data-integrity failure', new SnapshotDataIntegrityError()],
        ['a produce/deliver disagreement', new SnapshotFormatNotRecordedError()],
      ])(
        'should delete the message without attempting the webhook on %s',
        async (_case, storeError) => {
          MockSnapshotStore.readV4Snapshot.mockReturnValue(errAsync(storeError))

          await expect(
            createWebhookQueueHandler(SUCCESS_PRODUCER)(SNAPSHOT_SQS_MESSAGE),
          ).toResolve()

          expect(MockWebhookService.sendWebhook).not.toHaveBeenCalled()
          expect(SUCCESS_PRODUCER.sendMessage).not.toHaveBeenCalled()
        },
      )

      it.each([
        ['a transient read failure', new SnapshotReadError()],
        ['a denied read', new SnapshotAccessDeniedError()],
      ])(
        'should leave the message for redelivery, with no webhook attempt burned, on %s',
        async (_case, storeError) => {
          MockSnapshotStore.readV4Snapshot.mockReturnValue(errAsync(storeError))

          await expect(
            createWebhookQueueHandler(SUCCESS_PRODUCER)(SNAPSHOT_SQS_MESSAGE),
          ).toReject()

          expect(MockWebhookService.sendWebhook).not.toHaveBeenCalled()
          expect(MockWebhookService.saveWebhookRecord).not.toHaveBeenCalled()
          expect(SUCCESS_PRODUCER.sendMessage).not.toHaveBeenCalled()
        },
      )

      it('should carry the named step submission into the requeued message when the retry fails', async () => {
        MockSnapshotStore.readV4Snapshot.mockReturnValue(okAsync(MOCK_SNAPSHOT))
        MockWebhookService.sendWebhook.mockReturnValue(
          okAsync(MOCK_WEBHOOK_FAILURE_RESPONSE),
        )

        await expect(
          createWebhookQueueHandler(SUCCESS_PRODUCER)(SNAPSHOT_SQS_MESSAGE),
        ).toResolve()

        const [requeued] = (SUCCESS_PRODUCER.sendMessage as jest.Mock).mock
          .calls[0]
        expect(requeued.submissionIndex).toBe(0)
        expect(requeued.contentFormat).toBe('v4')
      })
    })
  })
})
