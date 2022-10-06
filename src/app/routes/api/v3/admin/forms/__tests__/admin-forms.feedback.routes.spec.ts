/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import { getEncryptedFormModel } from 'src/app/models/form.server.model'
import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import getUserModel from 'src/app/models/user.server.model'
import { IFormDocument, IUserSchema } from 'src/types'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

import {
  FormResponseMode,
  FormStatus,
} from '../../../../../../../../shared/types'
import { insertFormFeedback } from '../../../../../../modules/form/public-form/public-form.service'
import { AdminFormsRouter } from '../admin-forms.routes'

// Prevent rate limiting.
jest.mock('src/app/utils/limit-rate')

// Avoid async refresh calls
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

const UserModel = getUserModel(mongoose)
const EncryptFormModel = getEncryptedFormModel(mongoose)
const FormFeedbackModel = getFormFeedbackModel(mongoose)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-form.feedback.routes', () => {
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

  describe('GET /admin/forms/:formId/feedback', () => {
    let formForFeedback: IFormDocument
    beforeEach(async () => {
      formForFeedback = (await EncryptFormModel.create({
        title: 'form to view feedback',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })) as IFormDocument
    })

    it('should return 200 with empty feedback meta when no feedback exists', async () => {
      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback`,
      )

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        count: 0,
        feedback: [],
      })
    })

    it('should return 200 with form feedback meta when feedback exists', async () => {
      // Arrange
      const formFeedbacks = [
        {
          formId: formForFeedback._id,
          rating: 5,
          comment: 'nice',
          submissionId: new ObjectID().toHexString(),
        },
        {
          formId: formForFeedback._id,
          rating: 2,
          comment: 'not nice',
          submissionId: new ObjectID().toHexString(),
        },
      ]
      await insertFormFeedback(formFeedbacks[0])
      await insertFormFeedback(formFeedbacks[1])

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback`,
      )

      // Assert
      const expected = {
        average: (
          formFeedbacks.reduce((a, b) => a + b.rating, 0) / formFeedbacks.length
        ).toFixed(2),
        count: formFeedbacks.length,
        feedback: [
          expect.objectContaining({
            comment: formFeedbacks[0].comment,
            rating: formFeedbacks[0].rating,
            date: expect.any(String),
            dateShort: expect.any(String),
            timestamp: expect.any(Number),
            index: 1,
          }),
          expect.objectContaining({
            comment: formFeedbacks[1].comment,
            rating: formFeedbacks[1].rating,
            date: expect.any(String),
            dateShort: expect.any(String),
            timestamp: expect.any(Number),
            index: 2,
          }),
        ],
      }
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expected)
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback`,
      )

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have read permissions for form', async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      // Form that defaultUser has no access to.
      const inaccessibleForm = await EncryptFormModel.create({
        title: 'Collab form',
        publicKey: 'some public key',
        admin: anotherUser._id,
        permissionList: [],
      })

      // Act
      const response = await request.get(
        `/admin/forms/${inaccessibleForm._id}/feedback`,
      )

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform read operation',
        ),
      })
    })

    it('should return 404 when form cannot be found', async () => {
      // Act
      const response = await request.get(
        `/admin/forms/${new ObjectId()}/feedback`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      const archivedForm = await EncryptFormModel.create({
        title: 'archived form',
        status: FormStatus.Archived,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'does not matter',
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(
        `/admin/forms/${archivedForm._id}/feedback`,
      )

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be retrieved from the database', async () => {
      // Arrange
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst retrieving form feedback', async () => {
      // Arrange
      // Mock database error
      // @ts-ignore
      jest.spyOn(FormFeedbackModel, 'find').mockImplementationOnce(() => ({
        sort: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockRejectedValueOnce(new Error('something went wrong')),
      }))

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message:
          'Error: [something went wrong]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.',
      })
    })
  })

  describe('GET /admin/forms/:formId/feedback/count', () => {
    let formForFeedback: IFormDocument
    beforeEach(async () => {
      formForFeedback = (await EncryptFormModel.create({
        title: 'form to view feedback',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })) as IFormDocument
    })

    it('should return 200 with 0 count when no feedback exists', async () => {
      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(0)
    })

    it('should return 200 with feedback count when feedback exists', async () => {
      // Arrange
      const formFeedbacks = [
        {
          formId: formForFeedback._id,
          rating: 5,
          comment: 'nice',
          submissionId: new ObjectID().toHexString(),
        },
        {
          formId: formForFeedback._id,
          rating: 2,
          comment: 'not nice',
          submissionId: new ObjectID().toHexString(),
        },
      ]
      await insertFormFeedback(formFeedbacks[0])
      await insertFormFeedback(formFeedbacks[1])

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(formFeedbacks.length)
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have read permissions for form', async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      // Form that defaultUser has no access to.
      const inaccessibleForm = await EncryptFormModel.create({
        title: 'Collab form',
        publicKey: 'some public key',
        admin: anotherUser._id,
        permissionList: [],
      })

      // Act
      const response = await request.get(
        `/admin/forms/${inaccessibleForm._id}/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform read operation',
        ),
      })
    })

    it('should return 404 when form cannot be found', async () => {
      // Act
      const response = await request.get(
        `/admin/forms/${new ObjectId()}/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      const archivedForm = await EncryptFormModel.create({
        title: 'archived form',
        status: FormStatus.Archived,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'does not matter',
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(
        `/admin/forms/${archivedForm._id}/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be retrieved from the database', async () => {
      // Arrange
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst retrieving form feedback', async () => {
      // Arrange
      // Mock database error
      // @ts-ignore
      jest.spyOn(FormFeedbackModel, 'countDocuments').mockReturnValueOnce({
        exec: jest
          .fn()
          .mockRejectedValueOnce(new Error('something went wrong')),
      })

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message:
          'Error: [something went wrong]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.',
      })
    })
  })

  describe('GET /admin/forms/:formId/feedback/download', () => {
    let formForFeedback: IFormDocument
    beforeEach(async () => {
      formForFeedback = (await EncryptFormModel.create({
        title: 'form to view feedback',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })) as IFormDocument
    })

    it('should return 200 with feedback stream when feedbacks exist', async () => {
      // Arrange
      const formFeedbacks = [
        {
          formId: formForFeedback._id,
          rating: 5,
          comment: 'nice',
          submissionId: new ObjectID().toHexString(),
        },
        {
          formId: formForFeedback._id,
          rating: 2,
          comment: 'not nice',
          submissionId: new ObjectID().toHexString(),
        },
      ]
      await insertFormFeedback(formFeedbacks[0])
      await insertFormFeedback(formFeedbacks[1])

      // Act
      const response = await request
        .get(`/admin/forms/${formForFeedback._id}/feedback/download`)
        .buffer()
        .parse((res, cb) => {
          let buffer = ''
          res.on('data', (chunk) => {
            buffer += chunk
          })
          res.on('end', () => {
            cb(null, JSON.parse(buffer))
          })
        })

      // Assert
      const expected = await FormFeedbackModel.find({
        formId: formForFeedback._id,
      }).exec()
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(jsonParseStringify(expected))
    })

    it('should return 200 with empty stream when feedbacks do not exist', async () => {
      // Act
      const response = await request
        .get(`/admin/forms/${formForFeedback._id}/feedback/download`)
        .buffer()

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual([])
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback/download`,
      )

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have read permissions for form', async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      // Form that defaultUser has no access to.
      const inaccessibleForm = await EncryptFormModel.create({
        title: 'Collab form',
        publicKey: 'some public key',
        admin: anotherUser._id,
        permissionList: [],
      })

      // Act
      const response = await request.get(
        `/admin/forms/${inaccessibleForm._id}/feedback/download`,
      )

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform read operation',
        ),
      })
    })

    it('should return 404 when form cannot be found', async () => {
      // Act
      const response = await request.get(
        `/admin/forms/${new ObjectId()}/feedback/download`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      const archivedForm = await EncryptFormModel.create({
        title: 'archived form',
        status: FormStatus.Archived,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'does not matter',
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(
        `/admin/forms/${archivedForm._id}/feedback/download`,
      )

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be retrieved from the database', async () => {
      // Arrange
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.get(
        `/admin/forms/${formForFeedback._id}/feedback`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })
})
