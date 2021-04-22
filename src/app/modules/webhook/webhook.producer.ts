import { ResultAsync } from 'neverthrow'
import promiseRetry from 'promise-retry'
import { Producer } from 'sqs-producer'

import { createLoggerWithLabel } from '../../config/logger'

import { WebhookPushToQueueError } from './webhook.errors'

const logger = createLoggerWithLabel(module)

export class WebhookProducer {
  producer: Producer

  constructor(queueUrl: string) {
    this.producer = Producer.create({
      queueUrl,
    })
  }

  sendMessage(message: string): ResultAsync<true, WebhookPushToQueueError> {
    const sendMessageRetry = promiseRetry<true>(async (retry, attemptNum) => {
      try {
        await this.producer.send(message)
        return true
      } catch (error) {
        logger.error({
          message: `Failed to push webhook to queue`,
          meta: {
            action: 'sendMessage',
            attemptNum,
          },
          error,
        })
        return retry(error)
      }
    })
    return ResultAsync.fromPromise(sendMessageRetry, (error) => {
      logger.error({
        message: 'All attempts to push webhook to queue failed',
        meta: {
          action: 'sendMessage',
        },
        error,
      })
      return new WebhookPushToQueueError()
    })
  }
}
