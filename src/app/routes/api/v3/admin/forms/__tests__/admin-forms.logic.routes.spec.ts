import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import getUserModel from 'src/app/models/user.server.model'
import { ILogicSchema } from 'src/types'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { AdminFormsRouter } from '../admin-forms.routes'

const UserModel = getUserModel(mongoose)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-form.logic.routes', () => {
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

  describe('DELETE /forms/:formId/logic/:logicId', () => {
    it('should return 200 on successful form logic delete for email mode form', async () => {
      // Arrange
      const formLogicId = new ObjectId()
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm({
        formOptions: {
          form_logics: [
            {
              _id: formLogicId,
            } as ILogicSchema,
          ],
        },
      })
      const session = await createAuthedSession(user.email, request)

      // Act
      const response = await session
        .delete(`/admin/forms/${formToUpdate._id}/logic/${formLogicId}`)
        .send()

      // Assert
      expect(response.status).toEqual(200)
    })

    it('should return 200 on successful form logic delete for encrypt mode form', async () => {
      // Arrange
      const formLogicId = new ObjectId()
      const { form: formToUpdate, user } = await dbHandler.insertEncryptForm({
        formOptions: {
          form_logics: [
            {
              _id: formLogicId,
            } as ILogicSchema,
          ],
        },
      })
      const session = await createAuthedSession(user.email, request)

      // Act
      const response = await session
        .delete(`/admin/forms/${formToUpdate._id}/logic/${formLogicId}`)
        .send()

      // Assert
      expect(response.status).toEqual(200)
    })

    it('should return 403 when current user does not have permissions to delete form logic', async () => {
      // Arrange
      const formLogicId = new ObjectId()
      const { form: formToUpdate, agency } = await dbHandler.insertEncryptForm({
        formOptions: {
          form_logics: [
            {
              _id: formLogicId,
            } as ILogicSchema,
          ],
        },
      })
      const diffUser = await dbHandler.insertUser({
        mailName: 'newUser',
        agencyId: agency._id,
      })
      // Log in as different user.
      const session = await createAuthedSession(diffUser.email, request)

      // Act
      const response = await session
        .delete(`/admin/forms/${formToUpdate._id}/logic/${formLogicId}`)
        .send()

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform write operation',
        ),
      })
    })

    it('should return 404 with error message if logicId does not exist', async () => {
      // Arrange
      const formLogicId = new ObjectId()
      const wrongLogicId = new ObjectId()
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm({
        formOptions: {
          form_logics: [
            {
              _id: formLogicId,
            } as ILogicSchema,
          ],
        },
      })
      const session = await createAuthedSession(user.email, request)

      // Act
      const response = await session
        .delete(`/admin/forms/${formToUpdate._id}/logic/${wrongLogicId}`)
        .send()

      // Assert
      const expectedResponse = {
        message: 'logicId does not exist on form',
      }
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 404 with error message if form does not exist', async () => {
      // Arrange
      const formLogicId = new ObjectId()
      const { user } = await dbHandler.insertEmailForm({
        formOptions: {
          form_logics: [
            {
              _id: formLogicId,
            } as ILogicSchema,
          ],
        },
      })
      const session = await createAuthedSession(user.email, request)

      // Act
      const wrongFormId = new ObjectId()
      const response = await session
        .delete(`/admin/forms/${wrongFormId}/logic/${formLogicId}`)
        .send()

      // Assert
      const expectedResponse = {
        message: 'Form not found',
      }
      expect(response.status).toEqual(404)
      expect(response.body).toEqual(expectedResponse)
    })

    it('should return 422 when userId cannot be found in the database', async () => {
      // Arrange
      const formLogicId = new ObjectId()
      const { form: formToUpdate, user } = await dbHandler.insertEmailForm({
        formOptions: {
          form_logics: [
            {
              _id: formLogicId,
            } as ILogicSchema,
          ],
        },
      })
      const session = await createAuthedSession(user.email, request)

      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await session
        .delete(`/admin/forms/${formToUpdate._id}/logic/${formLogicId}`)
        .send()

      // Assert
      const expectedResponse = {
        message: 'User not found',
      }
      expect(response.status).toEqual(422)
      expect(response.body).toEqual(expectedResponse)
    })
  })
})
