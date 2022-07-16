import { ObjectId } from 'bson-ext'
import { merge } from 'lodash'
import mongoose from 'mongoose'
import { errAsync } from 'neverthrow'
import supertest, { Session } from 'supertest-session'

import getUserModel from 'src/app/models/user.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

import {
  FormStatus,
  SettingsUpdateDto,
} from '../../../../../../../../shared/types'
import * as UserService from '../../../../../../modules/user/user.service'
import { AdminFormsRouter } from '../admin-forms.routes'

// Avoid async refresh calls
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

const UserModel = getUserModel(mongoose)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-form.settings.routes', () => {
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

  describe('PUT /admin/forms/:formId/settings', () => {
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
        .patch(`/admin/forms/${formToUpdate._id}/settings`)
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
        .patch(`/admin/forms/${formToUpdate._id}/settings`)
        .send(settingsToUpdate)

      // Assert
      const expectedResponse = JSON.parse(
        // Should get updated with new settings
        JSON.stringify(merge(formToUpdate.getSettings(), settingsToUpdate)),
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
        .patch(`/admin/forms/${form._id}/settings`)
        .send({})

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: '', message: '"value" must have at least 1 key' },
        }),
      )
    })

    it('should return 200 with no setting changes when attempting to update emails of an encrypt mode form', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEncryptForm()
      const session = await createAuthedSession(user.email, request)
      const originalFormSettings = form.getSettings()
      const emailUpdateSettings: SettingsUpdateDto = {
        emails: ['test@example.com'],
      }

      // Act
      const response = await session
        .patch(`/admin/forms/${form._id}/settings`)
        .send(emailUpdateSettings)

      // Assert
      expect(response.status).toEqual(200)
      // Should have no changes
      expect(response.body).toEqual(originalFormSettings)
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      // Log in user.
      const { form } = await dbHandler.insertEncryptForm()

      // Act
      const response = await request
        .patch(`/admin/forms/${form._id}/settings`)
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
        .patch(`/admin/forms/${form._id}/settings`)
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
        status: FormStatus.Public,
      }
      const invalidFormId = new ObjectId().toHexString()

      // Act
      const response = await session
        .patch(`/admin/forms/${invalidFormId}/settings`)
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
      form.status = FormStatus.Archived
      await form.save()
      const session = await createAuthedSession(user.email, request)
      const settingsToUpdate: SettingsUpdateDto = {
        status: FormStatus.Public,
      }

      // Act
      const response = await session
        .patch(`/admin/forms/${form._id}/settings`)
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
        .patch(`/admin/forms/${form._id}/settings`)
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
        .patch(`/admin/forms/${form._id}/settings`)
        .send(settingsToUpdate)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({
        message: expect.any(String),
      })
    })
  })

  describe('PUT /admin/forms/:formId/collaborators', () => {
    const MOCK_COLLABORATORS = [
      {
        email: `fakeuser@test.gov.sg`,
        write: false,
      },
    ]
    it('should return 200 when the collaborators are updated successfully', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify(MOCK_COLLABORATORS)

      // Act
      const response = await session
        .put(`/admin/forms/${form._id}/collaborators`)
        .send(MOCK_COLLABORATORS)

      // Assert
      expect(response.status).toEqual(200)
      // NOTE: This is not strict equality because mongoose attaches an extra _id parameter
      expect(response.body).toMatchObject(expectedResponse)
    })

    it('should return 403 when the current session user does not have sufficient permissions to update the collaborators', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm()
      const fakeUser = await dbHandler.insertUser({
        mailName: 'fakeUser',
        agencyId: new ObjectId(),
      })
      const session = await createAuthedSession(fakeUser.email, request)
      const expectedResponse = jsonParseStringify({
        message: `User ${fakeUser.email.toLowerCase()} not authorized to perform write operation on Form ${
          form._id
        } with title: ${form.title}.`,
      })

      // Act
      const response = await session
        .put(`/admin/forms/${form._id}/collaborators`)
        .send(MOCK_COLLABORATORS)

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 when the form could not be found', async () => {
      // Arrange
      const { user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify({
        message: 'Form not found',
      })

      // Act
      const response = await session
        .put(`/admin/forms/${new ObjectId().toHexString()}/collaborators`)
        .send(MOCK_COLLABORATORS)

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 410 when the form has been archived', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEmailForm({
        formOptions: {
          status: FormStatus.Archived,
        },
      })
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify({
        message: 'Form has been archived',
      })

      // Act
      const response = await session
        .put(`/admin/forms/${form._id}/collaborators`)
        .send(MOCK_COLLABORATORS)

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 422 when the current session user cannot be retrieved', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify({
        message: 'User not found',
      })
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await session
        .put(`/admin/forms/${form._id}/collaborators`)
        .send(MOCK_COLLABORATORS)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when a database error occurs', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify({
        message: 'Something went wrong. Please try again.',
      })
      jest
        .spyOn(UserService, 'getPopulatedUserById')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      // Act
      const response = await session
        .put(`/admin/forms/${form._id}/collaborators`)
        .send(MOCK_COLLABORATORS)

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual(expectedResponse)
    })
  })

  describe('GET /admin/forms/:formId/collaborators', () => {
    const MOCK_COLLABORATORS = [
      {
        email: `fakeuser@test.gov.sg`,
        write: false,
      },
    ]
    it('should return the list of collaborators on a valid request', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEmailForm({
        formOptions: {
          permissionList: MOCK_COLLABORATORS,
        },
      })
      const session = await createAuthedSession(user.email, request)

      // Act
      const response = await session.get(
        `/admin/forms/${form._id}/collaborators`,
      )

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toMatchObject(
        jsonParseStringify(MOCK_COLLABORATORS),
      )
    })

    it('should return 403 when the current user does not have read permissions for the specified form', async () => {
      // Arrange
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          permissionList: MOCK_COLLABORATORS,
        },
      })
      const fakeUser = await dbHandler.insertUser({
        mailName: 'userWithoutReadPermissions',
        agencyId: new ObjectId(),
      })
      const session = await createAuthedSession(fakeUser.email, request)
      const expectedResponse = jsonParseStringify({
        message: `User ${fakeUser.email.toLowerCase()} not authorized to perform read operation on Form ${
          form._id
        } with title: ${form.title}.`,
      })

      // Act
      const response = await session.get(
        `/admin/forms/${form._id}/collaborators`,
      )

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toMatchObject(jsonParseStringify(expectedResponse))
    })

    it('should return 404 when the form could not be found', async () => {
      // Arrange
      const { user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify({
        message: 'Form not found',
      })

      // Act
      const response = await session.get(
        `/admin/forms/${new ObjectId().toHexString()}/collaborators`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 410 when the form has been archived', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEmailForm({
        formOptions: {
          status: FormStatus.Archived,
        },
      })
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify({
        message: 'Form has been archived',
      })

      // Act
      const response = await session.get(
        `/admin/forms/${form._id}/collaborators`,
      )

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 422 when the current session user cannot be retrieved', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify({
        message: 'User not found',
      })
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await session.get(
        `/admin/forms/${form._id}/collaborators`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 500 when a database error occurs', async () => {
      // Arrange
      const { form, user } = await dbHandler.insertEmailForm()
      const session = await createAuthedSession(user.email, request)
      const expectedResponse = jsonParseStringify({
        message: 'Something went wrong. Please try again.',
      })
      jest
        .spyOn(UserService, 'getPopulatedUserById')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      // Act
      const response = await session.get(
        `/admin/forms/${form._id}/collaborators`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual(expectedResponse)
    })
  })
})
