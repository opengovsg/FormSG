/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import { format, subDays } from 'date-fns'
import { times } from 'lodash'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import { aws } from 'src/app/config/config'
import {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import getSubmissionModel, {
  getEncryptSubmissionModel,
} from 'src/app/models/submission.server.model'
import getUserModel from 'src/app/models/user.server.model'
import { saveSubmissionMetadata } from 'src/app/modules/submission/email-submission/email-submission.service'
import { SubmissionHash } from 'src/app/modules/submission/email-submission/email-submission.types'
import {
  IFormDocument,
  IPopulatedEmailForm,
  IUserSchema,
  SubmissionCursorData,
} from 'src/types'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

import {
  FormResponseMode,
  FormStatus,
  SubmissionType,
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
const EmailFormModel = getEmailFormModel(mongoose)
const EncryptFormModel = getEncryptedFormModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

const ADMIN_FORMS_PREFIX = '/admin/forms'

const app = setupApp(ADMIN_FORMS_PREFIX, AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-form.submissions.routes', () => {
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
  describe('GET /:formId/submissions/count', () => {
    it('should return 200 with 0 count when email mode form has no submissions', async () => {
      // Arrange
      const newForm = await EmailFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Email,
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`,
      )

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(0)
    })

    it('should return 200 with 0 count when storage mode form has no submissions', async () => {
      // Arrange
      const newForm = await EncryptFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`,
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
        responseMode: FormResponseMode.Email,
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
        `${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`,
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
        responseMode: FormResponseMode.Encrypt,
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
        `${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`,
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
        responseMode: FormResponseMode.Email,
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
      const now = new Date()
      const firstSubmission = results[0]._unsafeUnwrap()
      firstSubmission.created = subDays(now, 5)
      await firstSubmission.save()

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`)
        .query({
          startDate: format(subDays(now, 6), 'yyyy-MM-dd'),
          endDate: format(subDays(now, 3), 'yyyy-MM-dd'),
        })

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(1)
    })

    it('should return 200 with counts of submissions made with same start and end dates', async () => {
      // Arrange
      const expectedSubmissionCount = 3
      const newForm = (await EmailFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Email,
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
      const expectedDate = '2021-04-04'
      const firstSubmission = results[0]._unsafeUnwrap()
      firstSubmission.created = new Date(expectedDate)
      await firstSubmission.save()

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`)
        .query({
          startDate: expectedDate,
          endDate: expectedDate,
        })

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(1)
    })

    it('should return 400 when query.startDate is missing when query.endDate is provided', async () => {
      // Arrange
      const newForm = await EncryptFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`)
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
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`)
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
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`)
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
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`)
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
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${newForm._id}/submissions/count`)
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
            message:
              '"endDate" must be greater than or equal to "ref:startDate"',
          },
        }),
      )
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${new ObjectId()}/submissions/count`,
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
        `${ADMIN_FORMS_PREFIX}/${inaccessibleForm._id}/submissions/count`,
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
        `${ADMIN_FORMS_PREFIX}/${invalidFormId}/submissions/count`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form to retrieve submission counts for is archived', async () => {
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
        `${ADMIN_FORMS_PREFIX}/${archivedForm._id}/submissions/count`,
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
        `${ADMIN_FORMS_PREFIX}/${new ObjectId()}/submissions/count`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst counting submissions', async () => {
      // Arrange
      const form = await EmailFormModel.create({
        title: 'normal form',
        status: FormStatus.Private,
        responseMode: FormResponseMode.Email,
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })
      // @ts-ignore
      jest.spyOn(SubmissionModel, 'countDocuments').mockReturnValueOnce({
        exec: jest.fn().mockRejectedValueOnce(new Error('some error')),
      })

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${form._id}/submissions/count`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('GET /:formId/submissions/download', () => {
    let defaultForm: IFormDocument

    beforeEach(async () => {
      defaultForm = (await EncryptFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'any public key',
        admin: defaultUser._id,
      })) as IFormDocument
    })

    it('should return 200 with stream of encrypted responses without attachment URLs when query.downloadAttachments is false', async () => {
      // Arrange
      const submissions = await Promise.all(
        times(11, (count) =>
          createEncryptSubmission({
            form: defaultForm,
            encryptedContent: `any encrypted content ${count}`,
            verifiedContent: `any verified content ${count}`,
            attachmentMetadata: new Map([
              ['fieldId1', `some.attachment.url.${count}`],
              ['fieldId2', `some.other.attachment.url.${count}`],
            ]),
          }),
        ),
      )

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/download`)
        .query({ downloadAttachments: false })
        .buffer()
        .parse((res, cb) => {
          let buffer = ''
          res.on('data', (chunk) => {
            buffer += chunk
          })
          res.on('end', () => cb(null, buffer))
        })

      // Assert
      const expectedSorted = submissions
        .map((s) =>
          jsonParseStringify({
            _id: s._id,
            submissionType: s.submissionType,
            // Expect returned submissions to not have attachment metadata.
            attachmentMetadata: {},
            encryptedContent: s.encryptedContent,
            verifiedContent: s.verifiedContent,
            created: s.created,
            version: s.version,
          }),
        )
        .sort((a, b) => String(a._id).localeCompare(String(b._id)))

      const actualSorted = (response.body as string)
        .split('\n')
        .map(
          (submissionStr: string) =>
            JSON.parse(submissionStr) as SubmissionCursorData,
        )
        .sort((a, b) => String(a._id).localeCompare(String(b._id)))

      expect(response.status).toEqual(200)
      expect(actualSorted).toEqual(expectedSorted)
    })

    it('should return 200 with stream of encrypted responses with attachment URLs when query.downloadAttachments is true', async () => {
      // Arrange
      const submissions = await Promise.all(
        times(5, (count) =>
          createEncryptSubmission({
            form: defaultForm,
            encryptedContent: `any encrypted content ${count}`,
            verifiedContent: `any verified content ${count}`,
            attachmentMetadata: new Map([
              ['fieldId1', `some.attachment.url.${count}`],
              ['fieldId2', `some.other.attachment.url.${count}`],
            ]),
          }),
        ),
      )

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/download`)
        .query({ downloadAttachments: true })
        .buffer()
        .parse((res, cb) => {
          let buffer = ''
          res.on('data', (chunk) => {
            buffer += chunk
          })
          res.on('end', () => cb(null, buffer))
        })

      // Assert
      const expectedSorted = submissions
        .map((s) =>
          jsonParseStringify({
            _id: s._id,
            submissionType: s.submissionType,
            // Expect returned submissions to also have attachment metadata.
            attachmentMetadata: s.attachmentMetadata,
            encryptedContent: s.encryptedContent,
            verifiedContent: s.verifiedContent,
            created: s.created,
            version: s.version,
          }),
        )
        .sort((a, b) => String(a._id).localeCompare(String(b._id)))
        .map((s) => ({
          ...s,
          // Require second map due to stringify stage prior to this.
          attachmentMetadata: {
            fieldId1: expect.stringContaining(s.attachmentMetadata['fieldId1']),
            fieldId2: expect.stringContaining(s.attachmentMetadata['fieldId2']),
          },
        }))

      const actualSorted = (response.body as string)
        .split('\n')
        .map(
          (submissionStr: string) =>
            JSON.parse(submissionStr) as SubmissionCursorData,
        )
        .sort((a, b) => String(a._id).localeCompare(String(b._id)))

      expect(response.status).toEqual(200)
      expect(actualSorted).toEqual(expectedSorted)
    })

    it('should return 200 with stream of encrypted responses when query.startDate is the same as query.endDate', async () => {
      // Arrange
      const submissions = await Promise.all(
        times(5, (count) =>
          createEncryptSubmission({
            form: defaultForm,
            encryptedContent: `any encrypted content ${count}`,
            verifiedContent: `any verified content ${count}`,
            attachmentMetadata: new Map([
              ['fieldId1', `some.attachment.url.${count}`],
              ['fieldId2', `some.other.attachment.url.${count}`],
            ]),
          }),
        ),
      )

      const expectedDate = '2020-02-03'
      // Set 2 submissions to be submitted with specific date
      submissions[2].created = new Date(expectedDate)
      submissions[4].created = new Date(expectedDate)
      await submissions[2].save()
      await submissions[4].save()
      const expectedSubmissionIds = [
        String(submissions[2]._id),
        String(submissions[4]._id),
      ]

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/download`)
        .query({
          startDate: expectedDate,
          endDate: expectedDate,
        })
        .buffer()
        .parse((res, cb) => {
          let buffer = ''
          res.on('data', (chunk) => {
            buffer += chunk
          })
          res.on('end', () => cb(null, buffer))
        })

      // Assert
      const expectedSorted = submissions
        .map((s) =>
          jsonParseStringify({
            _id: s._id,
            submissionType: s.submissionType,
            // Expect returned submissions to not have attachment metadata since query is false.
            attachmentMetadata: {},
            encryptedContent: s.encryptedContent,
            verifiedContent: s.verifiedContent,
            created: s.created,
            version: s.version,
          }),
        )
        .filter((s) => expectedSubmissionIds.includes(s._id))
        .sort((a, b) => String(a._id).localeCompare(String(b._id)))

      const actualSorted = (response.body as string)
        .split('\n')
        .map(
          (submissionStr: string) =>
            JSON.parse(submissionStr) as SubmissionCursorData,
        )
        .sort((a, b) => String(a._id).localeCompare(String(b._id)))

      expect(response.status).toEqual(200)
      expect(actualSorted).toEqual(expectedSorted)
    })

    it('should return 200 with stream of encrypted responses between given query.startDate and query.endDate', async () => {
      // Arrange
      const submissions = await Promise.all(
        times(5, (count) =>
          createEncryptSubmission({
            form: defaultForm,
            encryptedContent: `any encrypted content ${count}`,
            verifiedContent: `any verified content ${count}`,
            attachmentMetadata: new Map([
              ['fieldId1', `some.attachment.url.${count}`],
              ['fieldId2', `some.other.attachment.url.${count}`],
            ]),
          }),
        ),
      )

      const startDateStr = '2020-02-03'
      const endDateStr = '2020-02-04'
      // Set 2 submissions to be submitted with specific date
      submissions[2].created = new Date(startDateStr)
      submissions[4].created = new Date(endDateStr)
      await submissions[2].save()
      await submissions[4].save()
      const expectedSubmissionIds = [
        String(submissions[2]._id),
        String(submissions[4]._id),
      ]

      // Act
      const response = await request
        .get(`${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/download`)
        .query({
          startDate: startDateStr,
          endDate: endDateStr,
        })
        .buffer()
        .parse((res, cb) => {
          let buffer = ''
          res.on('data', (chunk) => {
            buffer += chunk
          })
          res.on('end', () => cb(null, buffer))
        })

      // Assert
      const expectedSorted = submissions
        .map((s) =>
          jsonParseStringify({
            _id: s._id,
            submissionType: s.submissionType,
            // Expect returned submissions to not have attachment metadata since query is false.
            attachmentMetadata: {},
            encryptedContent: s.encryptedContent,
            verifiedContent: s.verifiedContent,
            created: s.created,
            version: s.version,
          }),
        )
        .filter((s) => expectedSubmissionIds.includes(s._id))
        .sort((a, b) => String(a._id).localeCompare(String(b._id)))

      const actualSorted = (response.body as string)
        .split('\n')
        .map(
          (submissionStr: string) =>
            JSON.parse(submissionStr) as SubmissionCursorData,
        )
        .sort((a, b) => String(a._id).localeCompare(String(b._id)))

      expect(response.status).toEqual(200)
      expect(actualSorted).toEqual(expectedSorted)
    })

    it('should return 400 when form of given formId is not an encrypt mode form', async () => {
      // Arrange
      const emailForm = await EmailFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Email,
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${emailForm._id}/submissions/download`,
      )

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual({
        message: 'Attempted to submit encrypt form to email endpoint',
      })
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/download`,
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
        `${ADMIN_FORMS_PREFIX}/${inaccessibleForm._id}/submissions/download`,
      )

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform read operation',
        ),
      })
    })

    it('should return 404 when form to download submissions for cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId().toHexString()

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${invalidFormId}/submissions/download`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form to download submissions for is archived', async () => {
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
        `${ADMIN_FORMS_PREFIX}/${archivedForm._id}/submissions/download`,
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
        `${ADMIN_FORMS_PREFIX}/${new ObjectId()}/submissions/download`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })

  describe('GET /:formId/submissions/:submissionId', () => {
    let defaultForm: IFormDocument

    beforeEach(async () => {
      defaultForm = (await EncryptFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'any public key',
        admin: defaultUser._id,
      })) as IFormDocument
    })

    it('should return 200 with encrypted submission data of queried submissionId (without attachments)', async () => {
      // Arrange
      const expectedSubmissionParams = {
        encryptedContent: 'any encrypted content',
        verifiedContent: 'any verified content',
      }
      const submission = await createEncryptSubmission({
        form: defaultForm,
        ...expectedSubmissionParams,
      })

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/${String(
          submission._id,
        )}`,
      )

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        attachmentMetadata: {},
        content: expectedSubmissionParams.encryptedContent,
        refNo: String(submission._id),
        submissionTime: expect.any(String),
        verified: expectedSubmissionParams.verifiedContent,
        version: submission.version,
      })
    })

    it('should return 200 with encrypted submission data of queried submissionId (with attachments)', async () => {
      // Arrange
      const expectedSubmissionParams = {
        encryptedContent: 'any encrypted content',
        verifiedContent: 'any verified content',
        attachmentMetadata: new Map([
          ['fieldId1', 'some.attachment.url'],
          ['fieldId2', 'some.other.attachment.url'],
        ]),
      }
      const submission = await createEncryptSubmission({
        form: defaultForm,
        ...expectedSubmissionParams,
      })

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/${String(
          submission._id,
        )}`,
      )

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        attachmentMetadata: {
          fieldId1: expect.stringContaining(
            expectedSubmissionParams.attachmentMetadata.get('fieldId1') ?? 'no',
          ),
          fieldId2: expect.stringContaining(
            expectedSubmissionParams.attachmentMetadata.get('fieldId2') ?? 'no',
          ),
        },
        content: expectedSubmissionParams.encryptedContent,
        refNo: String(submission._id),
        submissionTime: expect.any(String),
        verified: expectedSubmissionParams.verifiedContent,
        version: submission.version,
      })
    })

    it('should return 400 when form of given formId is not an encrypt mode form', async () => {
      // Arrange
      const emailForm = await EmailFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Email,
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${emailForm._id}/submissions/${String(
          new ObjectId(),
        )}`,
      )

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual({
        message: 'Attempted to submit encrypt form to email endpoint',
      })
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${
          defaultForm._id
        }/adminform/submissions/${String(new ObjectId())}`,
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
        `${ADMIN_FORMS_PREFIX}/${inaccessibleForm._id}/submissions/${String(
          new ObjectId(),
        )}`,
      )

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform read operation',
        ),
      })
    })

    it('should return 404 when submission cannot be found', async () => {
      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/${String(
          new ObjectId(),
        )}`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: 'Unable to find encrypted submission from database',
      })
    })

    it('should return 404 when form to retrieve submission for cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId().toHexString()

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${invalidFormId}/submissions/${String(
          new ObjectId(),
        )}`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form to retrieve submission for is archived', async () => {
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
        `${ADMIN_FORMS_PREFIX}/${archivedForm._id}/submissions/${String(
          new ObjectId(),
        )}`,
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
        `${ADMIN_FORMS_PREFIX}/${new ObjectId()}/submissions/${String(
          new ObjectId(),
        )}`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst retrieving submission', async () => {
      // Arrange
      jest
        .spyOn(EncryptSubmissionModel, 'findEncryptedSubmissionById')
        .mockRejectedValueOnce(new Error('ohno'))
      const submission = await createEncryptSubmission({
        form: defaultForm,
        encryptedContent: 'any encrypted content',
        verifiedContent: 'any verified content',
      })

      // Act

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/${String(
          submission._id,
        )}`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: expect.stringContaining('ohno'),
      })
    })

    it('should return 500 when error occurs whilst creating presigned attachment urls', async () => {
      // Arrange
      // Mock error.
      jest
        .spyOn(aws.s3, 'getSignedUrlPromise')
        .mockRejectedValueOnce(new Error('something went wrong'))

      const submission = await createEncryptSubmission({
        form: defaultForm,
        encryptedContent: 'any encrypted content',
        verifiedContent: 'any verified content',
        attachmentMetadata: new Map([
          ['fieldId1', 'some.attachment.url'],
          ['fieldId2', 'some.other.attachment.url'],
        ]),
      })

      // Act
      const response = await request.get(
        `${ADMIN_FORMS_PREFIX}/${defaultForm._id}/submissions/${String(
          submission._id,
        )}`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Failed to create attachment URL',
      })
    })
  })

  describe('GET /:formId/submissions/metadata', () => {
    let defaultForm: IFormDocument

    beforeEach(async () => {
      defaultForm = (await EncryptFormModel.create({
        title: 'new form',
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'any public key',
        admin: defaultUser._id,
      })) as IFormDocument
    })

    it('should return 200 with empty results if no metadata exists', async () => {
      // Act
      const response = await request
        .get(`/admin/forms/${defaultForm._id}/submissions/metadata`)
        .query({
          page: 1,
        })

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({ count: 0, metadata: [] })
    })

    it('should return 200 with requested page of metadata when metadata exists', async () => {
      // Arrange
      // Create 11 submissions
      const submissions = await Promise.all(
        times(11, (count) =>
          createEncryptSubmission({
            form: defaultForm,
            encryptedContent: `any encrypted content ${count}`,
            verifiedContent: `any verified content ${count}`,
          }),
        ),
      )
      const createdSubmissionIds = submissions.map((s) => String(s._id))

      // Act
      const response = await request
        .get(`/admin/forms/${defaultForm._id}/submissions/metadata`)
        .query({
          page: 1,
        })

      // Assert
      const expected = times(10, (index) => ({
        number: 11 - index,
        // Loosen refNo checks due to non-deterministic aggregation query.
        // Just expect refNo is one of the possible ones.
        refNo: expect.toBeOneOf(createdSubmissionIds),
        submissionTime: expect.any(String),
      }))
      expect(response.status).toEqual(200)
      // Should be 11, but only return metadata of last 10 submissions due to page size.
      expect(response.body).toEqual({
        count: 11,
        metadata: expected,
      })
    })

    it('should return 200 with empty results if query.page does not have metadata', async () => {
      // Arrange
      // Create single submission
      await createEncryptSubmission({
        form: defaultForm,
        encryptedContent: `any encrypted content`,
        verifiedContent: `any verified content`,
      })

      // Act
      const response = await request
        .get(`/admin/forms/${defaultForm._id}/submissions/metadata`)
        .query({
          // Page 2 should have no submissions
          page: 2,
        })

      // Assert
      expect(response.status).toEqual(200)
      // Single submission count, but no metadata returned
      expect(response.body).toEqual({
        count: 1,
        metadata: [],
      })
    })

    it('should return 200 with metadata of single submissionId when query.submissionId is provided', async () => {
      // Arrange
      // Create 3 submissions
      const submissions = await Promise.all(
        times(3, (count) =>
          createEncryptSubmission({
            form: defaultForm,
            encryptedContent: `any encrypted content ${count}`,
            verifiedContent: `any verified content ${count}`,
          }),
        ),
      )

      // Act
      const response = await request
        .get(`/admin/forms/${defaultForm._id}/submissions/metadata`)
        .query({
          submissionId: String(submissions[1]._id),
        })

      // Assert
      expect(response.status).toEqual(200)
      // Only return the single submission id's metadata
      expect(response.body).toEqual({
        count: 1,
        metadata: [
          {
            number: 1,
            refNo: String(submissions[1]._id),
            submissionTime: expect.any(String),
          },
        ],
      })
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request
        .get(`/admin/forms/${defaultForm._id}/submissions/metadata`)
        .query({
          page: 10,
        })

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
      const response = await request
        .get(`/admin/forms/${inaccessibleForm._id}/submissions/metadata`)
        .query({
          page: 10,
        })

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform read operation',
        ),
      })
    })

    it('should return 404 when form to retrieve submission metadata for cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId().toHexString()

      // Act
      const response = await request
        .get(`/admin/forms/${invalidFormId}/submissions/metadata`)
        .query({
          page: 10,
        })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form to retrieve submission metadata for is archived', async () => {
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
        .get(`/admin/forms/${archivedForm._id}/submissions/metadata`)
        .query({
          page: 10,
        })

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
        .get(`/admin/forms/${new ObjectId()}/submissions/metadata`)
        .query({
          page: 10,
        })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst retrieving submission metadata list', async () => {
      // Arrange
      jest
        .spyOn(EncryptSubmissionModel, 'findAllMetadataByFormId')
        .mockRejectedValueOnce(new Error('ohno'))

      // Act
      const response = await request
        .get(`/admin/forms/${defaultForm._id}/submissions/metadata`)
        .query({
          page: 10,
        })

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: expect.stringContaining('ohno'),
      })
    })

    it('should return 500 when database error occurs whilst retrieving single submission metadata', async () => {
      // Arrange
      jest
        .spyOn(EncryptSubmissionModel, 'findSingleMetadata')
        .mockRejectedValueOnce(new Error('ohno'))

      // Act
      const response = await request
        .get(`/admin/forms/${defaultForm._id}/submissions/metadata`)
        .query({
          submissionId: new ObjectId().toHexString(),
        })

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: expect.stringContaining('ohno'),
      })
    })
  })
})

// Helper utils
const createEncryptSubmission = ({
  form,
  encryptedContent,
  verifiedContent,
  attachmentMetadata,
  created,
}: {
  form: IFormDocument
  encryptedContent: string
  attachmentMetadata?: Map<string, string>
  verifiedContent?: string
  created?: Date
}) => {
  return EncryptSubmissionModel.create({
    submissionType: SubmissionType.Encrypt,
    form: form._id,
    authType: form.authType,
    myInfoFields: form.getUniqueMyInfoAttrs(),
    attachmentMetadata,
    encryptedContent,
    verifiedContent,
    created,
    version: 1,
  })
}
