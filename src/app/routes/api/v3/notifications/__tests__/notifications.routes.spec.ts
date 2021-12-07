import supertest, { Session } from 'supertest-session'

import { setupApp } from 'tests/integration/helpers/express-setup'

import { ITwilioSmsWebhookBody } from './../../../../../../types/twilio'
import { NotificationsRouter } from './../notifications.routes'

// Prevent rate limiting.
jest.mock('src/app/utils/limit-rate')

const app = setupApp('/notifications', NotificationsRouter, {
  setupWithAuth: true,
})

describe('notifications.routes', () => {
  let request: Session
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    jest.clearAllMocks()
  })

  const MOCK_SUCCESSFUL_MESSAGE: ITwilioSmsWebhookBody = {
    SmsSid: '12345',
    SmsStatus: 'delivered',
    MessageStatus: 'delivered',
    To: '+12345678',
    MessageSid: 'SM212312',
    AccountSid: 'AC123456',
    From: '+12345678',
    ApiVersion: '2011-11-01',
  }

  const MOCK_FAILED_MESSAGE: ITwilioSmsWebhookBody = {
    SmsSid: '12345',
    SmsStatus: 'failed',
    MessageStatus: 'failed',
    To: '+12345678',
    MessageSid: 'SM212312',
    AccountSid: 'AC123456',
    From: '+12345678',
    ApiVersion: '2011-11-01',
    ErrorCode: 30001,
    ErrorMessage: 'Twilio is down!',
  }

  describe('POST notifications/twilio', () => {
    it('should return 200 on sending successful delivery status message', async () => {
      const response = await request
        .post('/notifications/twilio')
        .send(MOCK_SUCCESSFUL_MESSAGE)

      expect(response.status).toEqual(200)
      expect(response.body).toBeEmpty()
    })

    it('should return 200 on sending failed delivery status message', async () => {
      const response = await request
        .post('/notifications/twilio')
        .send(MOCK_FAILED_MESSAGE)

      expect(response.status).toEqual(200)
      expect(response.body).toBeEmpty()
    })
  })
})
