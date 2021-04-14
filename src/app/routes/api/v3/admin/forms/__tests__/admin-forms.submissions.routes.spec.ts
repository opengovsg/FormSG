/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import { format, subDays } from 'date-fns'
import { times } from 'lodash'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import getSubmissionModel from 'src/app/models/submission.server.model'
import getUserModel from 'src/app/models/user.server.model'
import { saveSubmissionMetadata } from 'src/app/modules/submission/email-submission/email-submission.service'
import { SubmissionHash } from 'src/app/modules/submission/email-submission/email-submission.types'
import {
  IPopulatedEmailForm,
  IUserSchema,
  ResponseMode,
  Status,
  SubmissionType,
} from 'src/types'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'

import { AdminFormsRouter } from '../admin-forms.routes'

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
const SubmissionModel = getSubmissionModel(mongoose)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

describe('GET /:formId/adminform/submissions/count', () => {
  let defaultUser: IUserSchema
  let request: Session

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

  it('should return 200 with 0 count when email mode form has no submissions', async () => {
    // Arrange
    const newForm = await EmailFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Email,
      emails: [defaultUser.email],
      admin: defaultUser._id,
    })

    // Act
    const response = await request.get(
      `/admin/forms/${newForm._id}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(200)
    expect(response.body).toEqual(0)
  })

  it('should return 200 with 0 count when storage mode form has no submissions', async () => {
    // Arrange
    const newForm = await EncryptFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Encrypt,
      publicKey: 'some public key',
      admin: defaultUser._id,
    })

    // Act
    const response = await request.get(
      `/admin/forms/${newForm._id}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(200)
    expect(response.body).toEqual(0)
  })

  it('should return 200 with form submission counts for email mode forms', async () => {
    // Arrange
    const expectedSubmissionCount = 5
    const newForm = (await EmailFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Email,
      emails: [defaultUser.email],
      admin: defaultUser._id,
    })) as IPopulatedEmailForm
    // Insert submissions
    const mockSubmissionHash: SubmissionHash = {
      hash: 'some hash',
      salt: 'some salt',
    }
    await Promise.all(
      times(expectedSubmissionCount, () =>
        saveSubmissionMetadata(newForm, mockSubmissionHash),
      ),
    )

    // Act
    const response = await request.get(
      `/admin/forms/${newForm._id}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(200)
    expect(response.body).toEqual(expectedSubmissionCount)
  })

  it('should return 200 with form submission counts for storage mode forms', async () => {
    // Arrange
    const expectedSubmissionCount = 3
    const newForm = await EncryptFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Encrypt,
      publicKey: 'some public key',
      admin: defaultUser._id,
    })
    await Promise.all(
      times(expectedSubmissionCount, (count) => {
        return SubmissionModel.create({
          submissionType: SubmissionType.Encrypt,
          form: newForm._id,
          authType: newForm.authType,
          myInfoFields: newForm.getUniqueMyInfoAttrs(),
          encryptedContent: `any encrypted content ${count}`,
          verifiedContent: `any verified content ${count}`,
          attachmentMetadata: new Map(),
          version: 1,
        })
      }),
    )

    // Act
    const response = await request.get(
      `/admin/forms/${newForm._id}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(200)
    expect(response.body).toEqual(expectedSubmissionCount)
  })

  it('should return 200 with counts of submissions made between given start and end dates.', async () => {
    // Arrange
    const expectedSubmissionCount = 3
    const newForm = (await EmailFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Email,
      emails: [defaultUser.email],
      admin: defaultUser._id,
    })) as IPopulatedEmailForm
    // Insert submissions
    const mockSubmissionHash: SubmissionHash = {
      hash: 'some hash',
      salt: 'some salt',
    }
    const results = await Promise.all(
      times(expectedSubmissionCount, () =>
        saveSubmissionMetadata(newForm, mockSubmissionHash),
      ),
    )
    // Update first submission to be 5 days ago.
    const now = new Date()
    const firstSubmission = results[0]._unsafeUnwrap()
    firstSubmission.created = subDays(now, 5)
    await firstSubmission.save()

    // Act
    const response = await request
      .get(`/admin/forms/${newForm._id}/submissions/count`)
      .query({
        startDate: format(subDays(now, 6), 'yyyy-MM-dd'),
        endDate: format(subDays(now, 3), 'yyyy-MM-dd'),
      })

    // Assert
    expect(response.status).toEqual(200)
    expect(response.body).toEqual(1)
  })

  it('should return 400 when query.startDate is missing when query.endDate is provided', async () => {
    // Arrange
    const newForm = await EncryptFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Encrypt,
      publicKey: 'some public key',
      admin: defaultUser._id,
    })

    // Act
    const response = await request
      .get(`/admin/forms/${newForm._id}/submissions/count`)
      .query({
        endDate: '2021-04-06',
      })

    // Assert
    expect(response.status).toEqual(400)
    expect(response.body).toEqual(
      buildCelebrateError({
        query: {
          key: 'endDate',
          message:
            '"endDate" date references "ref:startDate" which must have a valid date format',
        },
      }),
    )
  })

  it('should return 400 when query.endDate is missing when query.startDate is provided', async () => {
    // Arrange
    const newForm = await EncryptFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Encrypt,
      publicKey: 'some public key',
      admin: defaultUser._id,
    })

    // Act
    const response = await request
      .get(`/admin/forms/${newForm._id}/submissions/count`)
      .query({
        startDate: '2021-04-06',
      })

    // Assert
    expect(response.status).toEqual(400)
    expect(response.body).toEqual(
      buildCelebrateError({
        query: {
          key: '',
          message:
            '"value" contains [startDate] without its required peers [endDate]',
        },
      }),
    )
  })

  it('should return 400 when query.startDate is malformed', async () => {
    // Arrange
    const newForm = await EncryptFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Encrypt,
      publicKey: 'some public key',
      admin: defaultUser._id,
    })

    // Act
    const response = await request
      .get(`/admin/forms/${newForm._id}/submissions/count`)
      .query({
        startDate: 'not a date',
        endDate: '2021-04-06',
      })

    // Assert
    expect(response.status).toEqual(400)
    expect(response.body).toEqual(
      buildCelebrateError({
        query: {
          key: 'startDate',
          message: '"startDate" must be in YYYY-MM-DD format',
        },
      }),
    )
  })

  it('should return 400 when query.endDate is malformed', async () => {
    // Arrange
    const newForm = await EncryptFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Encrypt,
      publicKey: 'some public key',
      admin: defaultUser._id,
    })

    // Act
    const response = await request
      .get(`/admin/forms/${newForm._id}/submissions/count`)
      .query({
        startDate: '2021-04-06',
        // Wrong format
        endDate: '04-06-1993',
      })

    // Assert
    expect(response.status).toEqual(400)
    expect(response.body).toEqual(
      buildCelebrateError({
        query: {
          key: 'endDate',
          message: '"endDate" must be in YYYY-MM-DD format',
        },
      }),
    )
  })

  it('should return 400 when query.endDate is before query.startDate', async () => {
    // Arrange
    const newForm = await EncryptFormModel.create({
      title: 'new form',
      responseMode: ResponseMode.Encrypt,
      publicKey: 'some public key',
      admin: defaultUser._id,
    })

    // Act
    const response = await request
      .get(`/admin/forms/${newForm._id}/submissions/count`)
      .query({
        startDate: '2021-04-06',
        endDate: '2020-01-01',
      })

    // Assert
    expect(response.status).toEqual(400)
    expect(response.body).toEqual(
      buildCelebrateError({
        query: {
          key: 'endDate',
          message: '"endDate" must be greater than "ref:startDate"',
        },
      }),
    )
  })

  it('should return 401 when user is not logged in', async () => {
    // Arrange
    await logoutSession(request)

    // Act
    const response = await request.get(
      `/admin/forms/${new ObjectId()}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(401)
    expect(response.body).toEqual({ message: 'User is unauthorized.' })
  })

  it('should return 403 when user does not have read permissions to form', async () => {
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
      `/admin/forms/${inaccessibleForm._id}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(403)
    expect(response.body).toEqual({
      message: expect.stringContaining(
        'not authorized to perform read operation',
      ),
    })
  })

  it('should return 404 when form to retrieve submission counts for cannot be found', async () => {
    // Arrange
    const invalidFormId = new ObjectId().toHexString()

    // Act
    const response = await request.get(
      `/admin/forms/${invalidFormId}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(404)
    expect(response.body).toEqual({ message: 'Form not found' })
  })

  it('should return 410 when form to retrieve submission counts for is archived', async () => {
    // Arrange
    const archivedForm = await EncryptFormModel.create({
      title: 'archived form',
      status: Status.Archived,
      responseMode: ResponseMode.Encrypt,
      publicKey: 'does not matter',
      admin: defaultUser._id,
    })

    // Act
    const response = await request.get(
      `/admin/forms/${archivedForm._id}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(410)
    expect(response.body).toEqual({ message: 'Form has been archived' })
  })

  it('should return 422 when user in session cannot be retrieved from the database', async () => {
    // Arrange
    // Clear user collection
    await dbHandler.clearCollection(UserModel.collection.name)

    // Act
    const response = await request.get(
      `/admin/forms/${new ObjectId()}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(422)
    expect(response.body).toEqual({ message: 'User not found' })
  })

  it('should return 500 when database error occurs whilst counting submissions', async () => {
    // Arrange
    const form = await EmailFormModel.create({
      title: 'normal form',
      status: Status.Private,
      responseMode: ResponseMode.Email,
      emails: [defaultUser.email],
      admin: defaultUser._id,
    })
    // @ts-ignore
    jest.spyOn(SubmissionModel, 'countDocuments').mockReturnValueOnce({
      exec: jest.fn().mockRejectedValueOnce(new Error('some error')),
    })

    // Act
    const response = await request.get(
      `/admin/forms/${form._id}/submissions/count`,
    )

    // Assert
    expect(response.status).toEqual(500)
    expect(response.body).toEqual({
      message: 'Something went wrong. Please try again.',
    })
  })
})
