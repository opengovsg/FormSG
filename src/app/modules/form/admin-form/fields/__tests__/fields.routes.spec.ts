/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import { okAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import getUserModel from 'src/app/models/user.server.model'
import * as AuthService from 'src/app/modules/auth/auth.service'
import { BasicField, IPopulatedForm, IUserSchema, Status } from 'src/types'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { generateDefaultField } from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

import { FieldsRouter } from '../fields.routes'

// Prevent rate limiting.
jest.mock('src/app/utils/limit-rate')
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

const UserModel = getUserModel(mongoose)
const EmailFormModel = getEmailFormModel(mongoose)
const EncryptFormModel = getEncryptedFormModel(mongoose)

const app = setupApp(undefined, FieldsRouter, {
  setupWithAuth: true,
})

describe('fields.routes', () => {
  let request: Session
  let defaultUser: IUserSchema

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
    const { user } = await dbHandler.insertFormCollectionReqs()
    // Default all requests to come from authenticated user.
    request = await createAuthedSession(user.email, request)
    defaultUser = user
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('POST /:formId/fields/:fieldId/duplicate', () => {
    it('should return 200 with updated form with duplicated field', async () => {
      // Arrange
      const defaultField = generateDefaultField(BasicField.Date)
      const formToUpdate = (await EmailFormModel.create({
        title: 'Form to update',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [defaultField],
      })) as IPopulatedForm

      const fieldToDuplicate = formToUpdate.form_fields[0]

      // Act
      const response = await request.post(
        `/${formToUpdate._id}/fields/${fieldToDuplicate._id}/duplicate`,
      )

      // Assert
      const expected = await EmailFormModel.findById(formToUpdate._id)
        .populate({
          path: 'admin',
          populate: {
            path: 'agency',
          },
        })
        .lean()
      expect(response.status).toEqual(200)
      expect(expected?.form_fields![0]).toEqual(defaultField)
      expect(expected?.form_fields![1]).toEqual(defaultField)
      expect(expected?.__v).toEqual(1)
      expect(response.body).toEqual(jsonParseStringify(expected))
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      const formToUpdate = (await EmailFormModel.create({
        title: 'Form to update',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [generateDefaultField(BasicField.Date)],
      })) as IPopulatedForm

      const fieldToDuplicate = formToUpdate.form_fields[0]

      // Act
      const response = await request.post(
        `/${formToUpdate._id}/fields/${fieldToDuplicate._id}/duplicate`,
      )

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have permissions to update form', async () => {
      // Arrange
      // Create separate user
      const collabUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'collab-user',
          shortName: 'collabUser',
        })
      ).user

      const randomForm = (await EncryptFormModel.create({
        title: 'form that user has no write access to',
        admin: collabUser._id,
        publicKey: 'some random key',
        permissionList: [{ email: defaultUser.email }],
        form_fields: [generateDefaultField(BasicField.Date)],
      })) as IPopulatedForm

      const fieldToDuplicate = randomForm.form_fields[0]

      // Act
      const response = await request.post(
        `/${randomForm._id}/fields/${fieldToDuplicate._id}/duplicate`,
      )

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: `User ${defaultUser.email} not authorized to perform write operation on Form ${randomForm._id} with title: ${randomForm.title}.`,
      })
    })

    it('should return 404 when form to update cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId()
      const randomFieldId = new ObjectId()

      // Act
      const response = await request
        .post(`/${invalidFormId}/fields/${randomFieldId}/duplicate`)
        .send({
          form: { permissionList: [{ email: 'test@example.com' }] },
        })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 404 when field to update cannot be found', async () => {
      // Arrange
      const formToUpdate = (await EmailFormModel.create({
        title: 'Form to update',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [generateDefaultField(BasicField.Date)],
      })) as IPopulatedForm

      const fieldToDuplicate = formToUpdate.form_fields[0]
      let randomFieldId = new ObjectId()

      while (fieldToDuplicate._id == randomFieldId) {
        randomFieldId = new ObjectId()
      }

      // Act
      const response = await request.post(
        `/${formToUpdate._id}/fields/${randomFieldId}/duplicate`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      // Create archived form.
      const archivedForm = (await EmailFormModel.create({
        title: 'Form already archived',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [generateDefaultField(BasicField.Date)],
        status: Status.Archived,
      })) as IPopulatedForm

      const fieldToDuplicate = archivedForm.form_fields[0]

      // Act
      const response = await request.post(
        `/${archivedForm._id}/fields/${fieldToDuplicate._id}/duplicate`,
      )

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be found in the database', async () => {
      // Arrange
      const formToUpdate = (await EmailFormModel.create({
        title: 'Form to archive',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [generateDefaultField(BasicField.Date)],
      })) as IPopulatedForm

      const fieldToDuplicate = formToUpdate.form_fields[0]

      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.post(
        `/${formToUpdate._id}/fields/${fieldToDuplicate._id}/duplicate`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst updating form', async () => {
      // Arrange
      const formToUpdate = (await EmailFormModel.create({
        title: 'Form to update',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [generateDefaultField(BasicField.Date)],
      })) as IPopulatedForm

      const fieldToDuplicate = formToUpdate.form_fields[0]

      formToUpdate.save = jest
        .fn()
        .mockRejectedValue(new Error('something happened'))

      jest
        .spyOn(AuthService, 'getFormAfterPermissionChecks')
        .mockReturnValue(okAsync(formToUpdate))

      // Act
      const response = await request.post(
        `/${formToUpdate._id}/fields/${fieldToDuplicate._id}/duplicate`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message:
          'Error: [something happened]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.',
      })
    })
  })
})
