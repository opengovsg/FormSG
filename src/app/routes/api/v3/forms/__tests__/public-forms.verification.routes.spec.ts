import { StatusCodes } from 'http-status-codes'
import session, { Session } from 'supertest-session'

import { BasicField } from 'src/types'

import { setupApp } from 'tests/integration/helpers/express-setup'
import { generateDefaultField } from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { PublicFormsVerificationRouter } from '../public-forms.verification.routes'

const verificationApp = setupApp('/forms', PublicFormsVerificationRouter)

jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))
// Default Twilio export is a function
jest.mock('twilio', () => () => ({
  messages: {
    create: jest.fn().mockResolvedValue({
      sid: 'mockSid',
    }),
  },
}))

describe('public-forms.verification.routes', () => {
  let mockEmptyFormId: string
  let mockVerifiableFormId: string
  let request: Session

  beforeAll(async () => await dbHandler.connect())

  beforeEach(async () => {
    request = session(verificationApp)
    jest.clearAllMocks()
    await dbHandler.clearDatabase()

    // Form without verifiable fields
    const { form: emptyForm } = await dbHandler.insertEmailForm()
    mockEmptyFormId = String(emptyForm._id)

    // Form with verifiable fields
    const emailField = generateDefaultField(BasicField.Email, {
      isVerifiable: true,
    })
    const mobileField = generateDefaultField(BasicField.Mobile, {
      isVerifiable: true,
    })
    const { form: verifiableForm } = await dbHandler.insertEmailForm({
      // Alternative mail domain so as not to clash with emptyForm
      mailDomain: 'test2.gov.sg',
      formOptions: {
        form_fields: [emailField, mobileField],
      },
    })
    mockVerifiableFormId = String(verifiableForm._id)
  })

  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /forms/:formId/fieldverifications', () => {
    it('should return 404 when formId is malformed', async () => {
      // Act
      const response = await request.post(`/forms/malformed/fieldverifications`)

      // Assert
      expect(response.status).toBe(StatusCodes.NOT_FOUND)
    })

    it('should return 200 when form has no verifiable fields', async () => {
      // Act
      const response = await request
        // ID of form with no verifiable fields
        .post(`/forms/${mockEmptyFormId}/fieldverifications`)

      // Assert
      expect(response.status).toBe(StatusCodes.OK)
      expect(response.body).toEqual({})
    })

    it('should return 201 when form has verifiable fields', async () => {
      // Act
      const response = await request
        // ID of form with verifiable fields
        .post(`/forms/${mockVerifiableFormId}/fieldverifications`)

      // Assert
      expect(response.status).toBe(StatusCodes.CREATED)
      expect(response.body).toEqual({
        transactionId: expect.any(String),
        expireAt: expect.any(String),
      })
    })
  })
})
