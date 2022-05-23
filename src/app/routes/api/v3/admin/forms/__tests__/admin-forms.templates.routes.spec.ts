import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import getFormTemplateModel from 'src/app/models/form_template.server.model'
import { IUserSchema } from 'src/types'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

import { AdminFormsRouter } from '../admin-forms.routes'

// Prevent rate limiting.
jest.mock('src/app/utils/limit-rate')
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

const GET_FORM_TEMPLATES_ROUTE = '/admin/forms/templates'

const FormTemplateModel = getFormTemplateModel(mongoose)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-forms.templates.routes', () => {
  let request: Session
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertFormCollectionReqs()
    request = await createAuthedSession(user.email, request)
    defaultUser = user
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('GET /admin/forms/templates', () => {
    it('should return 200 with empty array when there are no form templates', async () => {
      const response = await request.get(GET_FORM_TEMPLATES_ROUTE)

      expect(response.status).toEqual(200)
      expect(response.body).toEqual([])
    })

    it('should return 200 with an array of available form templates', async () => {
      await FormTemplateModel.create({
        title: 'Form Template',
        admin: defaultUser._id,
      })

      const response = await request.get(GET_FORM_TEMPLATES_ROUTE)
      const expected = await FormTemplateModel.find({}).lean()

      expect(response.status).toEqual(200)
      expect(response.body).toEqual(jsonParseStringify(expected))
    })

    it('should return 401 when user is not logged in', async () => {
      await logoutSession(request)
      const response = await request.get(GET_FORM_TEMPLATES_ROUTE)

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 500 when database errors occur', async () => {
      jest
        .spyOn(FormTemplateModel, 'getFormTemplates')
        .mockRejectedValueOnce(new Error('something went wrong'))

      const response = await request.get(GET_FORM_TEMPLATES_ROUTE)
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message:
          'Error: [something went wrong]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.',
      })
    })
  })
})
