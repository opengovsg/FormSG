/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import mongoose from 'mongoose'
import SparkMD5 from 'spark-md5'
import supertest, { Session } from 'supertest-session'

import { aws } from 'src/app/config/config'
import { getEncryptedFormModel } from 'src/app/models/form.server.model'
import getUserModel from 'src/app/models/user.server.model'
import { IUserSchema } from 'src/types'

import { createAuthedSession } from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { VALID_UPLOAD_FILE_TYPES } from '../../../../../../../../shared/constants/file'
import {
  FormResponseMode,
  FormStatus,
} from '../../../../../../../../shared/types'
import { AdminFormsRouter } from '../admin-forms.routes'

// Prevent rate limiting.
jest.mock('src/app/utils/limit-rate')
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue(true),
  }),
}))

// Avoid async refresh calls
jest.mock('src/app/modules/spcp/spcp.oidc.client.ts')

const UserModel = getUserModel(mongoose)
const EncryptFormModel = getEncryptedFormModel(mongoose)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-form.presign.routes', () => {
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

  describe('POST /admin/forms/:formId/images/presign', () => {
    const DEFAULT_POST_PARAMS = {
      fileId: 'some file id',
      fileMd5Hash: SparkMD5.hash('test file name'),
      fileType: VALID_UPLOAD_FILE_TYPES[0],
    }

    it('should return 200 with presigned POST URL object', async () => {
      // Arrange
      const form = await EncryptFormModel.create({
        title: 'form',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })

      // Act
      const response = await request
        .post(`/admin/forms/${form._id}/images/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(200)
      // Should equal mocked result.
      expect(response.body).toEqual({
        url: expect.any(String),
        fields: expect.objectContaining({
          'Content-MD5': DEFAULT_POST_PARAMS.fileMd5Hash,
          'Content-Type': DEFAULT_POST_PARAMS.fileType,
          key: expect.any(String),
          // Should have correct permissions.
          acl: 'public-read',
          bucket: expect.any(String),
        }),
      })
      expect(response.body.fields.key).toEqual(
        expect.stringContaining(DEFAULT_POST_PARAMS.fileId),
      )
      expect(DEFAULT_POST_PARAMS.fileId.length).toEqual(
        response.body.fields.key.length - 25,
      )

      expect(response.body.fields.key).toMatch(/^[a-fA-F0-9]{24}-/)
    })

    it('should allow client to include isNewClient param', async () => {
      // TODO(#4228): isNewClient in param was allowed for backward compatibility after #4213 removed isNewClient flag from frontend. To remove 2 weeks after release.
      // Arrange
      const form = await EncryptFormModel.create({
        title: 'form',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })

      const POST_PARAM_ISNEWCLIENT = {
        ...DEFAULT_POST_PARAMS,
        isNewClient: true,
      }

      // Act
      const response = await request
        .post(`/admin/forms/${form._id}/images/presign`)
        .send(POST_PARAM_ISNEWCLIENT)

      // Assert
      expect(response.status).toEqual(200)
      // Should equal mocked result.
      expect(response.body).toEqual({
        url: expect.any(String),
        fields: expect.objectContaining({
          'Content-MD5': POST_PARAM_ISNEWCLIENT.fileMd5Hash,
          'Content-Type': POST_PARAM_ISNEWCLIENT.fileType,
          key: expect.any(String),
          // Should have correct permissions.
          acl: 'public-read',
          bucket: expect.any(String),
        }),
      })
      expect(response.body.fields.key).toEqual(
        expect.stringContaining(POST_PARAM_ISNEWCLIENT.fileId),
      )
      expect(POST_PARAM_ISNEWCLIENT.fileId.length).toEqual(
        response.body.fields.key.length - 25,
      )

      expect(response.body.fields.key).toMatch(/^[a-fA-F0-9]{24}-/)
    })

    it('should return 400 when body.fileId is missing', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/images/presign`)
        .send({
          // missing fileId.
          fileMd5Hash: SparkMD5.hash('test file name'),
          fileType: VALID_UPLOAD_FILE_TYPES[0],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'fileId' },
        }),
      )
    })

    it('should return 400 when body.fileId is an empty string', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/images/presign`)
        .send({
          fileId: '',
          fileMd5Hash: SparkMD5.hash('test file name'),
          fileType: VALID_UPLOAD_FILE_TYPES[1],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fileId',
            message: '"fileId" is not allowed to be empty',
          },
        }),
      )
    })

    it('should return 400 when body.fileType is missing', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/images/presign`)
        .send({
          fileId: 'some id',
          fileMd5Hash: SparkMD5.hash('test file name'),
          // Missing fileType.
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'fileType' },
        }),
      )
    })

    it('should return 400 when body.fileType is invalid', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/images/presign`)
        .send({
          fileId: 'some id',
          fileMd5Hash: SparkMD5.hash('test file name'),
          fileType: 'some random type',
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fileType',
            message: `"fileType" must be one of [${VALID_UPLOAD_FILE_TYPES.join(
              ', ',
            )}]`,
          },
        }),
      )
    })

    it('should return 400 when body.fileMd5Hash is missing', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/images/presign`)
        .send({
          fileId: 'some id',
          // Missing fileMd5Hash
          fileType: VALID_UPLOAD_FILE_TYPES[2],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'fileMd5Hash' },
        }),
      )
    })

    it('should return 400 when body.fileMd5Hash is not a base64 string', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/images/presign`)
        .send({
          fileId: 'some id',
          fileMd5Hash: 'rubbish hash',
          fileType: VALID_UPLOAD_FILE_TYPES[2],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fileMd5Hash',
            message: '"fileMd5Hash" must be a valid base64 string',
          },
        }),
      )
    })

    it('should return 400 when creating presigned POST URL object errors', async () => {
      // Arrange
      // Mock error.
      jest
        .spyOn(aws.s3, 'createPresignedPost')
        // @ts-ignore
        .mockImplementationOnce((_opts, cb) =>
          cb(new Error('something went wrong')),
        )
      const form = await EncryptFormModel.create({
        title: 'form',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })

      // Act
      const response = await request
        .post(`/admin/forms/${form._id}/images/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual({
        message: 'Error occurred whilst uploading file',
      })
    })

    it('should return 404 when form to upload image to cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId().toHexString()

      // Act
      const response = await request
        .post(`/admin/forms/${invalidFormId}/images/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form to upload image to is already archived', async () => {
      // Arrange
      const archivedForm = await EncryptFormModel.create({
        title: 'archived form',
        status: FormStatus.Archived,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'does not matter',
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .post(`/admin/forms/${archivedForm._id}/images/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be retrieved from the database', async () => {
      // Arrange
      // Clear user collection
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/images/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })

  describe('POST /admin/forms/:formId/logos/presign', () => {
    const DEFAULT_POST_PARAMS = {
      fileId: 'some other file id',
      fileMd5Hash: SparkMD5.hash('test file name again'),
      fileType: VALID_UPLOAD_FILE_TYPES[2],
    }

    it('should return 200 with presigned POST URL object', async () => {
      // Arrange
      const form = await EncryptFormModel.create({
        title: 'form',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })

      // Act
      const response = await request
        .post(`/admin/forms/${form._id}/logos/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(200)
      // Should equal mocked result.
      expect(response.body).toEqual({
        url: expect.any(String),
        fields: expect.objectContaining({
          'Content-MD5': DEFAULT_POST_PARAMS.fileMd5Hash,
          'Content-Type': DEFAULT_POST_PARAMS.fileType,
          key: expect.any(String),
          // Should have correct permissions.
          acl: 'public-read',
          bucket: expect.any(String),
        }),
      })

      expect(response.body.fields.key).toEqual(
        expect.stringContaining(DEFAULT_POST_PARAMS.fileId),
      )
      expect(DEFAULT_POST_PARAMS.fileId.length).toEqual(
        response.body.fields.key.length - 25,
      )

      expect(response.body.fields.key).toMatch(/^[a-fA-F0-9]{24}-/)
    })

    it('should allow client to include isNewClient param', async () => {
      // TODO(#4228): isNewClient in param was allowed for backward compatibility after #4213 removed isNewClient flag from frontend. To remove 2 weeks after release.
      // Arrange
      const form = await EncryptFormModel.create({
        title: 'form',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })

      const POST_PARAM_ISNEWCLIENT = {
        ...DEFAULT_POST_PARAMS,
        isNewClient: true,
      }

      // Act
      const response = await request
        .post(`/admin/forms/${form._id}/logos/presign`)
        .send(POST_PARAM_ISNEWCLIENT)

      // Assert
      expect(response.status).toEqual(200)
      // Should equal mocked result.
      expect(response.body).toEqual({
        url: expect.any(String),
        fields: expect.objectContaining({
          'Content-MD5': POST_PARAM_ISNEWCLIENT.fileMd5Hash,
          'Content-Type': POST_PARAM_ISNEWCLIENT.fileType,
          key: expect.any(String),
          // Should have correct permissions.
          acl: 'public-read',
          bucket: expect.any(String),
        }),
      })

      expect(response.body.fields.key).toEqual(
        expect.stringContaining(POST_PARAM_ISNEWCLIENT.fileId),
      )
      expect(POST_PARAM_ISNEWCLIENT.fileId.length).toEqual(
        response.body.fields.key.length - 25,
      )

      expect(response.body.fields.key).toMatch(/^[a-fA-F0-9]{24}-/)
    })

    it('should return 400 when body.fileId is missing', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/logos/presign`)
        .send({
          // missing fileId.
          fileMd5Hash: SparkMD5.hash('test file name'),
          fileType: VALID_UPLOAD_FILE_TYPES[0],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'fileId' },
        }),
      )
    })

    it('should return 400 when body.fileId is an empty string', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/logos/presign`)
        .send({
          fileId: '',
          fileMd5Hash: SparkMD5.hash('test file name'),
          fileType: VALID_UPLOAD_FILE_TYPES[1],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fileId',
            message: '"fileId" is not allowed to be empty',
          },
        }),
      )
    })

    it('should return 400 when body.fileType is missing', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/logos/presign`)
        .send({
          fileId: 'some id',
          fileMd5Hash: SparkMD5.hash('test file name'),
          // Missing fileType.
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'fileType' },
        }),
      )
    })

    it('should return 400 when body.fileType is invalid', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/logos/presign`)
        .send({
          fileId: 'some id',
          fileMd5Hash: SparkMD5.hash('test file name'),
          fileType: 'some random type',
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fileType',
            message: `"fileType" must be one of [${VALID_UPLOAD_FILE_TYPES.join(
              ', ',
            )}]`,
          },
        }),
      )
    })

    it('should return 400 when body.fileMd5Hash is missing', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/logos/presign`)
        .send({
          fileId: 'some id',
          // Missing fileMd5Hash
          fileType: VALID_UPLOAD_FILE_TYPES[2],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'fileMd5Hash' },
        }),
      )
    })

    it('should return 400 when body.fileMd5Hash is not a base64 string', async () => {
      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/logos/presign`)
        .send({
          fileId: 'some id',
          fileMd5Hash: 'rubbish hash',
          fileType: VALID_UPLOAD_FILE_TYPES[2],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'fileMd5Hash',
            message: '"fileMd5Hash" must be a valid base64 string',
          },
        }),
      )
    })

    it('should return 400 when creating presigned POST URL object errors', async () => {
      // Arrange
      // Mock error.
      jest
        .spyOn(aws.s3, 'createPresignedPost')
        // @ts-ignore
        .mockImplementationOnce((_opts, cb) =>
          cb(new Error('something went wrong')),
        )
      const form = await EncryptFormModel.create({
        title: 'form',
        admin: defaultUser._id,
        publicKey: 'does not matter again',
      })

      // Act
      const response = await request
        .post(`/admin/forms/${form._id}/logos/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual({
        message: 'Error occurred whilst uploading file',
      })
    })

    it('should return 404 when form to upload logo to cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId().toHexString()

      // Act
      const response = await request
        .post(`/admin/forms/${invalidFormId}/logos/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form to upload logo to is already archived', async () => {
      // Arrange
      const archivedForm = await EncryptFormModel.create({
        title: 'archived form',
        status: FormStatus.Archived,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'does not matter',
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .post(`/admin/forms/${archivedForm._id}/logos/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be retrieved from the database', async () => {
      // Arrange
      // Clear user collection
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request
        .post(`/admin/forms/${new ObjectId()}/logos/presign`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })
})
