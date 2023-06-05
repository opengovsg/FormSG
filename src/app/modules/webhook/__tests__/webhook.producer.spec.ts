import { ObjectId } from 'bson'
import { addHours, addMinutes, subMinutes } from 'date-fns'
import { Producer } from 'sqs-producer'

import { MAX_DELAY_SECONDS } from '../webhook.constants'
import { WebhookPushToQueueError } from '../webhook.errors'
import { WebhookQueueMessage } from '../webhook.message'
import { WebhookProducer } from '../webhook.producer'

jest.mock('sqs-producer')
const MockSqsProducer = jest.mocked(Producer)

describe('WebhookProducer', () => {
  let webhookProducer: WebhookProducer
  const mockSendMessage = jest.fn()

  const MOCK_NOW = Date.now()

  const MESSAGE_BODY = {
    submissionId: new ObjectId().toHexString(),
    previousAttempts: [MOCK_NOW],
    nextAttempt: MOCK_NOW,
    _v: 0,
  }

  beforeAll(() => {
    MockSqsProducer.create.mockReturnValue({
      send: mockSendMessage,
    } as unknown as Producer)
    webhookProducer = new WebhookProducer('')
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW)
  })

  describe('sendMessage', () => {
    it('should return true when message is sent on first try', async () => {
      mockSendMessage.mockResolvedValueOnce([])
      const webhookMessage = new WebhookQueueMessage(MESSAGE_BODY)

      const result = await webhookProducer.sendMessage(webhookMessage)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledTimes(1)
      expect(mockSendMessage).toHaveBeenCalledWith({
        body: JSON.stringify(webhookMessage.message),
        id: webhookMessage.submissionId,
        delaySeconds: expect.any(Number),
      })
    })

    it('should return true when message fails on first try, but subsequently succeeds', async () => {
      mockSendMessage
        .mockRejectedValueOnce(new Error(''))
        .mockResolvedValueOnce([])
      const webhookMessage = new WebhookQueueMessage(MESSAGE_BODY)

      const result = await webhookProducer.sendMessage(webhookMessage)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledTimes(2)
      expect(mockSendMessage).toHaveBeenCalledWith({
        body: JSON.stringify(webhookMessage.message),
        id: webhookMessage.submissionId,
        delaySeconds: expect.any(Number),
      })
    })

    it('should return WebhookPushToQueueError when message fails all attempts to be sent', async () => {
      mockSendMessage.mockRejectedValue(new Error(''))
      const webhookMessage = new WebhookQueueMessage(MESSAGE_BODY)

      const result = await webhookProducer.sendMessage(webhookMessage, {
        minTimeout: 0,
      })

      expect(result._unsafeUnwrapErr()).toEqual(new WebhookPushToQueueError())
      // promise-retry retries 10 times by default, so total is 1 try + 10 retries = 11
      expect(mockSendMessage).toHaveBeenCalledTimes(11)
      expect(mockSendMessage).toHaveBeenCalledWith({
        body: JSON.stringify(webhookMessage.message),
        id: webhookMessage.submissionId,
        delaySeconds: expect.any(Number),
      })
    })

    it('should queue message with 0 delay when nextAttempt is in the past', async () => {
      mockSendMessage.mockResolvedValueOnce([])
      const webhookMessage = new WebhookQueueMessage({
        ...MESSAGE_BODY,
        nextAttempt: subMinutes(MOCK_NOW, 10).getTime(),
      })

      const result = await webhookProducer.sendMessage(webhookMessage)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledTimes(1)
      expect(mockSendMessage).toHaveBeenCalledWith({
        body: JSON.stringify(webhookMessage.message),
        id: webhookMessage.submissionId,
        delaySeconds: 0,
      })
    })

    it('should queue message with a maximum of 15min delay when nextAttempt is in the future', async () => {
      mockSendMessage.mockResolvedValueOnce([])
      const webhookMessage = new WebhookQueueMessage({
        ...MESSAGE_BODY,
        nextAttempt: addHours(MOCK_NOW, 10).getTime(),
      })

      const result = await webhookProducer.sendMessage(webhookMessage)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledTimes(1)
      expect(mockSendMessage).toHaveBeenCalledWith({
        body: JSON.stringify(webhookMessage.message),
        id: webhookMessage.submissionId,
        delaySeconds: MAX_DELAY_SECONDS,
      })
    })

    it('should queue message with exactly the required delay of nextAttempt is less than 15min in the future', async () => {
      const minutesInFuture = 10
      mockSendMessage.mockResolvedValueOnce([])
      const webhookMessage = new WebhookQueueMessage({
        ...MESSAGE_BODY,
        nextAttempt: addMinutes(MOCK_NOW, minutesInFuture).getTime(),
      })

      const result = await webhookProducer.sendMessage(webhookMessage)

      expect(result._unsafeUnwrap()).toBe(true)
      expect(mockSendMessage).toHaveBeenCalledTimes(1)
      expect(mockSendMessage).toHaveBeenCalledWith({
        body: JSON.stringify(webhookMessage.message),
        id: webhookMessage.submissionId,
        delaySeconds: minutesInFuture * 60,
      })
    })
  })
})
