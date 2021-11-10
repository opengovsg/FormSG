import { CreateSecretResponse } from 'aws-sdk/clients/secretsmanager'
import { okAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import * as AdminFormService from '../../../../../../../app/modules/form/admin-form/admin-form.service'
import { AdminFormsRouter } from '../admin-forms.routes'

import { TwilioCredentials } from './../../../../../../services/sms/sms.types'

// Prevent rate limiting.
jest.mock('src/app/utils/limit-rate')

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

// const MOCK_FORM_ID = new ObjectId().toHexString()
const MOCK_ACCOUNT_SID = 'AC12345678'
const MOCK_API_KEY_SID = 'SK12345678'
const MOCK_API_KEY_SECRET = 'AZ12345678'
const MOCK_MESSAGING_SERVICE_SID = 'MG12345678'
const TWILIO_CREDENTIALS: TwilioCredentials = {
  accountSid: MOCK_ACCOUNT_SID,
  apiKey: MOCK_API_KEY_SID,
  apiSecret: MOCK_API_KEY_SECRET,
  messagingServiceSid: MOCK_MESSAGING_SERVICE_SID,
}

describe('admin-form.twilio.routes', () => {
  let request: Session

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('PUT /admin/forms/:formId/twilio', () => {
    it('should return 200 on successful twilio credentials addition', async () => {
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const msgSrvcName = `formsg/testing/form/${formToUpdate._id}/twilio`

      const MOCK_CREATE_SECRET_RESPONSE: CreateSecretResponse = {
        Name: msgSrvcName,
      }

      const createwilioCredentialsSpy = jest
        .spyOn(AdminFormService, 'createTwilioCredentials')
        .mockReturnValueOnce(okAsync(MOCK_CREATE_SECRET_RESPONSE))

      // Actual
      const response = await session
        .put(`/admin/forms/${formToUpdate._id}/twilio`)
        .send(TWILIO_CREDENTIALS)

      // Assert
      expect(createwilioCredentialsSpy).toBeCalled()
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({ Name: msgSrvcName })
    })
  })
})
