import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import getUserModel from 'src/app/models/user.server.model'
import { SettingsUpdateDto } from 'src/shared/typings/form'
import { Status } from 'src/types'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { AdminFormRouter } from '../admin-form.routes'

const UserModel = getUserModel(mongoose)

const app = setupApp('/admin/form', AdminFormRouter, {
  setupWithAuth: true,
})

describe('admin-form.routes', () => {
  let request: Session

  const USER_ID = new ObjectId()

  beforeAll(async () => await dbHandler.connect())
  beforeEach(async () => {
    request = supertest(app)
  })
  afterEach(async () => {
    await dbHandler.clearDatabase()
    jest.restoreAllMocks()
  })
  afterAll(async () => await dbHandler.closeDatabase())

  describe('PATCH /form/:formId/settings', () => {
    it('should return 200 with latest form settings on successful update for email mode forms', async () => {
      // Arrange
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)

      const settingsToUpdate: SettingsUpdateDto = {
        title: 'new title to update',
      }
      expect(formToUpdate.title).not.toEqual(settingsToUpdate.title)

      // Act
      const response = await session
        .patch(`/admin/form/${formToUpdate._id}/settings`)
        .send(settingsToUpdate)

      // Assert
      const expectedResponse = JSON.parse(
        JSON.stringify({
          ...formToUpdate.getSettings(),
          // Should get updated with new settings
          ...settingsToUpdate,
        }),
      )
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 200 with latest form settings on successful update for encrypt mode forms', async () => {
      // Arrange
      const { form: formToUpdate, user } = await dbHandler.insertEncryptForm()
      const session = await createAuthedSession(user.email, request)

      const settingsToUpdate: SettingsUpdateDto = {
        webhook: {
          url: 'https://example.com',
        },
      }
      expect(formToUpdate.webhook).not.toEqual(settingsToUpdate.webhook)

      // Act
      const response = await session
        .patch(`/admin/form/${formToUpdate._id}/settings`)
        .send(settingsToUpdate)

      // Assert
      const expectedResponse = JSON.parse(
        JSON.stringify({
          ...formToUpdate.getSettings(),
          // Should get updated with new settings
          ...settingsToUpdate,
        }),
      )
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 400 when patching with empty form settings', async () => {
      // Arrange
      // Log in user.
      const { form, user } = await dbHandler.insertEmailForm({
        userId: USER_ID,
      })
      const session = await createAuthedSession(user.email, request)

      // Act
      const response = await session
        .patch(`/admin/form/${form._id}/settings`)
        .send({})

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: '', message: '"value" must have at least 1 key' },
        }),
      )
    })

    it('should return 400 when attempting to update emails of an encrypt mode form', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEncryptForm()
      const session = await createAuthedSession(user.email, request)
      const invalidModelSettings: SettingsUpdateDto = {
        emails: 'test@example.com',
      }

      // Act
      const response = await session
        .patch(`/admin/form/${form._id}/settings`)
        .send(invalidModelSettings)

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual({
        message: 'Settings update parameters are invalid.',
      })
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      // Log in user.
      const { form } = await dbHandler.insertEncryptForm()

      // Act
      const response = await request
        .patch(`/admin/form/${form._id}/settings`)
        .send({})

      expect(response.status).toEqual(401)
      expect(response.body).toEqual({
        message: 'User is unauthorized.',
      })
    })

    it('should return 403 when current user does not have permissions to update form settings', async () => {
      // Arrange
      const { form, agency } = await dbHandler.insertEncryptForm()
      const diffUser = await dbHandler.insertUser({
        mailName: 'newUser',
        agencyId: agency._id,
      })
      // Log in as different user.
      const session = await createAuthedSession(diffUser.email, request)
      const settingsToUpdate: SettingsUpdateDto = {
        hasCaptcha: false,
      }

      // Act
      const response = await session
        .patch(`/admin/form/${form._id}/settings`)
        .send(settingsToUpdate)

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.any(String),
      })
    })

    it('should return 404 when form to update settings for cannot be found', async () => {
      // Arrange
      const { user } = await dbHandler.insertFormCollectionReqs({
        userId: USER_ID,
      })
      const session = await createAuthedSession(user.email, request)
      const settingsToUpdate: SettingsUpdateDto = {
        status: Status.Public,
      }
      const invalidFormId = new ObjectId().toHexString()

      // Act
      const response = await session
        .patch(`/admin/form/${invalidFormId}/settings`)
        .send(settingsToUpdate)

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: 'Form not found',
      })
    })

    it('should return 410 when updating settings for archived form', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEncryptForm()
      // Set form state to archived
      form.status = Status.Archived
      await form.save()
      const session = await createAuthedSession(user.email, request)
      const settingsToUpdate: SettingsUpdateDto = {
        status: Status.Public,
      }

      // Act
      const response = await session
        .patch(`/admin/form/${form._id}/settings`)
        .send(settingsToUpdate)

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({
        message: 'Form has been archived',
      })
    })

    it('should return 422 when userId cannot be found in the database', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEncryptForm()
      const session = await createAuthedSession(user.email, request)
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)
      const settingsToUpdate: SettingsUpdateDto = {
        webhook: {
          url: 'https://example.com',
        },
      }

      // Act
      const response = await session
        .patch(`/admin/form/${form._id}/settings`)
        .send(settingsToUpdate)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 422 when an invalid settings update is attempted on the form', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEncryptForm()
      const session = await createAuthedSession(user.email, request)
      const settingsToUpdate: SettingsUpdateDto = {
        webhook: {
          // DNS resolution should fail for this form, resulting in model error.
          url: 'https://test.example.com',
        },
      }

      // Act
      const response = await session
        .patch(`/admin/form/${form._id}/settings`)
        .send(settingsToUpdate)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({
        message: expect.any(String),
      })
    })
  })
})
