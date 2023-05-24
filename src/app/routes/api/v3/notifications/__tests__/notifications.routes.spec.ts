import { setupApp } from '__tests__/integration/helpers/express-setup'
import supertest, { Session } from 'supertest-session'

import { ITwilioSmsWebhookBody } from 'src/types'

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
    MessagingServiceSid: 'MG123456',
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
    MessagingServiceSid: 'MG123456',
    From: '+12345678',
    ApiVersion: '2011-11-01',
    ErrorCode: 30001,
    ErrorMessage: 'Twilio is down!',
  }

  const TWILIO_SIGNATURE_HEADER_KEY = 'x-twilio-signature'
  const MOCK_TWILIO_SIGNATURE = 'mockSignature'

  describe('POST notifications/twilio', () => {
    it('should return 200 on sending successful delivery status message', async () => {
      const response = await request
        .post('/notifications/twilio')
        .send(MOCK_SUCCESSFUL_MESSAGE)
        .set(TWILIO_SIGNATURE_HEADER_KEY, MOCK_TWILIO_SIGNATURE)

      expect(response.status).toEqual(200)
      expect(response.body).toBeEmpty()
    })

    it('should return 200 on sending failed delivery status message', async () => {
      const response = await request
        .post('/notifications/twilio')
        .send(MOCK_FAILED_MESSAGE)
        .set(TWILIO_SIGNATURE_HEADER_KEY, MOCK_TWILIO_SIGNATURE)

      expect(response.status).toEqual(200)
      expect(response.body).toBeEmpty()
    })

    it('should return 400 on sending successful delivery status message without wilio signature', async () => {
      const response = await request
        .post('/notifications/twilio')
        .send(MOCK_SUCCESSFUL_MESSAGE)

      expect(response.status).toEqual(400)
    })
  })
})
