/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import supertest, { Session } from 'supertest-session'

import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import getUserModel from 'src/app/models/user.server.model'
import {
  MOCK_ATTACHMENT_FIELD,
  MOCK_ATTACHMENT_RESPONSE,
  MOCK_CHECKBOX_FIELD,
  MOCK_CHECKBOX_RESPONSE,
  MOCK_OPTIONAL_VERIFIED_FIELD,
  MOCK_OPTIONAL_VERIFIED_RESPONSE,
  MOCK_SECTION_FIELD,
  MOCK_SECTION_RESPONSE,
  MOCK_TEXT_FIELD,
  MOCK_TEXTFIELD_RESPONSE,
} from 'src/app/modules/submission/email-submission/__tests__/email-submission.test.constants'
import { FormFieldSchema, IFormSchema, IUserSchema } from 'src/types'
import { EncryptFormFieldResponse, EncryptSubmissionDto } from 'src/types/api'

import {
  createAuthedSession,
  logoutSession,
} from 'tests/integration/helpers/express-auth'
import { setupApp } from 'tests/integration/helpers/express-setup'
import { buildCelebrateError } from 'tests/unit/backend/helpers/celebrate'
import {
  generateDefaultField,
  generateUnprocessedSingleAnswerResponse,
} from 'tests/unit/backend/helpers/generate-form-data'
import dbHandler from 'tests/unit/backend/helpers/jest-db'
import { jsonParseStringify } from 'tests/unit/backend/helpers/serialize-data'

import {
  BasicField,
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
const FormModel = getFormModel(mongoose)
const EmailFormModel = getEmailFormModel(mongoose)
const EncryptFormModel = getEncryptedFormModel(mongoose)

const app = setupApp('/admin/forms', AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-form.preview.routes', () => {
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

  describe('GET /admin/forms/:formId/preview', () => {
    it("should return 200 with own form's public form view even when private", async () => {
      // Arrange
      const formToPreview = await EncryptFormModel.create({
        title: 'some form',
        admin: defaultUser._id,
        publicKey: 'some random key',
        // Private status.
        status: FormStatus.Private,
      })

      // Act
      const response = await request.get(
        `/admin/forms/${formToPreview._id}/preview`,
      )

      // Assert
      const expectedForm = (
        await formToPreview
          .populate({
            path: 'admin',
            populate: {
              path: 'agency',
            },
          })
          .execPopulate()
      ).getPublicView()
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        form: jsonParseStringify(expectedForm),
      })
    })

    it("should return 200 with collaborator's form's public form view", async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      const collabFormToPreview = await EmailFormModel.create({
        title: 'some form',
        admin: anotherUser._id,
        emails: [anotherUser.email],
        // Only read permissions.
        permissionList: [{ email: defaultUser.email }],
      })

      // Act
      const response = await request.get(
        `/admin/forms/${collabFormToPreview._id}/preview`,
      )

      // Assert
      const expectedForm = (
        await collabFormToPreview
          .populate({
            path: 'admin',
            populate: {
              path: 'agency',
            },
          })
          .execPopulate()
      ).getPublicView()
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({ form: jsonParseStringify(expectedForm) })
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
      const unauthedForm = await EmailFormModel.create({
        title: 'some form',
        admin: anotherUser._id,
        emails: [anotherUser.email],
        // defaultUser does not have read permissions.
      })

      // Act
      const response = await request.get(
        `/admin/forms/${unauthedForm._id}/preview`,
      )

      // Arrange
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform read operation',
        ),
      })
    })

    it('should return 404 when form to preview cannot be found', async () => {
      // Act
      const response = await request.get(
        `/admin/forms/${new ObjectId()}/preview`,
      )

      // Arrange
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: 'Form not found',
      })
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
        `/admin/forms/${archivedForm._id}/preview`,
      )

      // Arrange
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({
        message: 'Form has been archived',
      })
    })

    it('should return 422 when user in session cannot be found in the database', async () => {
      // Arrange
      const formToPreview = await EmailFormModel.create({
        title: 'some other form',
        admin: defaultUser._id,
        status: FormStatus.Public,
        emails: [defaultUser.email],
      })
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.get(
        `/admin/forms/${formToPreview._id}/preview`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({
        message: 'User not found',
      })
    })

    it('should return 500 when database error occurs whilst retrieving form to preview', async () => {
      // Arrange
      const formToPreview = await EmailFormModel.create({
        title: 'some other form',
        admin: defaultUser._id,
        status: FormStatus.Public,
        emails: [defaultUser.email],
      })
      // Mock database error.
      jest
        .spyOn(FormModel, 'getFullFormById')
        .mockRejectedValueOnce(new Error('something went wrong'))

      // Act
      const response = await request.get(
        `/admin/forms/${formToPreview._id}/preview`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('POST /admin/forms/:formId/preview/submissions/email', () => {
    const SUBMISSIONS_ENDPT_BASE = '/admin/forms'
    it('should return 200 when submission is valid', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_TEXT_FIELD],
          admin: defaultUser._id,
        },
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        // MOCK_RESPONSE contains all required keys
        .field(
          'body',
          JSON.stringify({
            responses: [MOCK_TEXTFIELD_RESPONSE],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when answer is empty string for optional field', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [
            { ...MOCK_TEXT_FIELD, required: false } as FormFieldSchema,
          ],
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answer: '' }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when attachment response has filename and content', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_ATTACHMENT_FIELD],
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [
              {
                ...MOCK_ATTACHMENT_RESPONSE,
                content: MOCK_ATTACHMENT_RESPONSE.content.toString('binary'),
              },
            ],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when response has isHeader key', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_SECTION_FIELD],
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [{ ...MOCK_SECTION_RESPONSE, isHeader: true }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when signature is empty string for optional verified field', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_OPTIONAL_VERIFIED_FIELD],
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [{ ...MOCK_OPTIONAL_VERIFIED_RESPONSE, signature: '' }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 200 when response has answerArray and no answer', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          form_fields: [MOCK_CHECKBOX_FIELD],
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [MOCK_CHECKBOX_RESPONSE],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        message: 'Form submission successful.',
        submissionId: expect.any(String),
      })
    })

    it('should return 400 when responses key is missing', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        // Note missing responses
        .field('body', JSON.stringify({}))
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response is missing _id', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, '_id')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response is missing fieldType', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'fieldType')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response has invalid fieldType', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [
              { ...MOCK_TEXTFIELD_RESPONSE, fieldType: 'definitelyInvalid' },
            ],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response is missing answer', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_TEXTFIELD_RESPONSE, 'answer')],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when response has both answer and answerArray', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [{ ...MOCK_TEXTFIELD_RESPONSE, answerArray: [] }],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when attachment response has filename but not content', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'content'],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })

    it('should return 400 when attachment response has content but not filename', async () => {
      const { form } = await dbHandler.insertEmailForm({
        formOptions: {
          hasCaptcha: false,
          status: FormStatus.Public,
          admin: defaultUser._id,
        },
        // Avoid default mail domain so that user emails in the database don't conflict
        mailDomain: 'test2.gov.sg',
      })

      const response = await request
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}/preview/submissions/email`)
        .field(
          'body',
          JSON.stringify({
            responses: [omit(MOCK_ATTACHMENT_RESPONSE), 'filename'],
          }),
        )
        .query({ captchaResponse: 'null' })

      expect(response.status).toBe(400)
      expect(response.body.message).toEqual('Validation failed')
    })
  })

  describe('POST /admin/forms/:formId/preview/submissions/encrypt', () => {
    const MOCK_FIELD_ID = new ObjectId().toHexString()
    const MOCK_ATTACHMENT_FIELD_ID = new ObjectId().toHexString()
    const MOCK_RESPONSE = omit(
      generateUnprocessedSingleAnswerResponse(BasicField.Email, {
        _id: MOCK_FIELD_ID,
        answer: 'a@abc.com',
      }),
      'question',
    ) as EncryptFormFieldResponse
    const MOCK_ENCRYPTED_CONTENT = `${'a'.repeat(44)};${'a'.repeat(
      32,
    )}:${'a'.repeat(4)}`
    const MOCK_VERSION = 1
    const MOCK_SUBMISSION_BODY: EncryptSubmissionDto = {
      responses: [MOCK_RESPONSE],
      encryptedContent: MOCK_ENCRYPTED_CONTENT,
      version: MOCK_VERSION,
      attachments: {
        [MOCK_ATTACHMENT_FIELD_ID]: {
          encryptedFile: {
            binary: '10101',
            nonce: 'mockNonce',
            submissionPublicKey: 'mockPublicKey',
          },
        },
      },
    }
    let mockForm: IFormSchema

    beforeEach(async () => {
      mockForm = await EncryptFormModel.create({
        title: 'mock form',
        publicKey: 'some public key',
        admin: defaultUser._id,
        form_fields: [
          generateDefaultField(BasicField.Email, { _id: MOCK_FIELD_ID }),
        ],
      })
    })

    it('should return 200 with submission ID when request is valid', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send(MOCK_SUBMISSION_BODY)

      expect(response.body.message).toBe('Form submission successful.')
      expect(mongoose.isValidObjectId(response.body.submissionId)).toBe(true)
      expect(response.status).toBe(200)
    })

    it('should return 401 when user is not signed in', async () => {
      await logoutSession(request)

      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send(MOCK_SUBMISSION_BODY)

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 400 when responses are not provided in body', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send(omit(MOCK_SUBMISSION_BODY, 'responses'))

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'responses' } }),
      )
    })

    it('should return 400 when responses are missing _id field', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          responses: [omit(MOCK_RESPONSE, '_id')],
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'responses.0._id',
            message: '"responses[0]._id" is required',
          },
        }),
      )
    })

    it('should return 400 when responses are missing answer field', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          responses: [omit(MOCK_RESPONSE, 'answer')],
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'responses.0.answer',
            message: '"responses[0].answer" is required',
          },
        }),
      )
    })

    it('should return 400 when responses are missing fieldType', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          responses: [omit(MOCK_RESPONSE, 'fieldType')],
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'responses.0.fieldType',
            message: '"responses[0].fieldType" is required',
          },
        }),
      )
    })

    it('should return 400 when a fieldType is malformed', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          responses: [{ ...MOCK_RESPONSE, fieldType: 'malformed' }],
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'responses.0.fieldType',
            message: expect.stringContaining(
              '"responses[0].fieldType" must be one of ',
            ),
          },
        }),
      )
    })

    it('should return 400 when encryptedContent is not provided in body', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send(omit(MOCK_SUBMISSION_BODY, 'encryptedContent'))

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'encryptedContent',
          },
        }),
      )
    })

    it('should return 400 when version is not provided in body', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send(omit(MOCK_SUBMISSION_BODY, 'version'))

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'version',
          },
        }),
      )
    })

    it('should return 400 when encryptedContent is malformed', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({ ...MOCK_SUBMISSION_BODY, encryptedContent: 'abc' })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'encryptedContent',
            message: 'Invalid encryptedContent.',
          },
        }),
      )
    })

    it('should return 400 when attachment field ID is malformed', async () => {
      const invalidKey = 'invalidFieldId'
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          attachments: {
            [invalidKey]: {
              encryptedFile: {
                binary: '10101',
                nonce: 'mockNonce',
                submissionPublicKey: 'mockPublicKey',
              },
            },
          },
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: `attachments.${invalidKey}`,
            message: `"attachments.${invalidKey}" is not allowed`,
          },
        }),
      )
    })

    it('should return 400 when attachment is missing encryptedFile key', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          attachments: {
            [MOCK_ATTACHMENT_FIELD_ID]: {},
          },
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: `attachments.${MOCK_ATTACHMENT_FIELD_ID}.encryptedFile`,
            message: `"attachments.${MOCK_ATTACHMENT_FIELD_ID}.encryptedFile" is required`,
          },
        }),
      )
    })

    it('should return 400 when attachment is missing binary', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          attachments: {
            [MOCK_ATTACHMENT_FIELD_ID]: {
              encryptedFile: {
                // binary is missing
                nonce: 'mockNonce',
                submissionPublicKey: 'mockPublicKey',
              },
            },
          },
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: `attachments.${MOCK_ATTACHMENT_FIELD_ID}.encryptedFile.binary`,
            message: `"attachments.${MOCK_ATTACHMENT_FIELD_ID}.encryptedFile.binary" is required`,
          },
        }),
      )
    })

    it('should return 400 when attachment is missing nonce', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          attachments: {
            [MOCK_ATTACHMENT_FIELD_ID]: {
              encryptedFile: {
                binary: '10101',
                // nonce is missing
                submissionPublicKey: 'mockPublicKey',
              },
            },
          },
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: `attachments.${MOCK_ATTACHMENT_FIELD_ID}.encryptedFile.nonce`,
            message: `"attachments.${MOCK_ATTACHMENT_FIELD_ID}.encryptedFile.nonce" is required`,
          },
        }),
      )
    })

    it('should return 400 when attachment is missing public key', async () => {
      const response = await request
        .post(`/admin/forms/${mockForm._id}/preview/submissions/encrypt`)
        .send({
          ...MOCK_SUBMISSION_BODY,
          attachments: {
            [MOCK_ATTACHMENT_FIELD_ID]: {
              encryptedFile: {
                binary: '10101',
                nonce: 'mockNonce',
                // missing public key
              },
            },
          },
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: `attachments.${MOCK_ATTACHMENT_FIELD_ID}.encryptedFile.submissionPublicKey`,
            message: `"attachments.${MOCK_ATTACHMENT_FIELD_ID}.encryptedFile.submissionPublicKey" is required`,
          },
        }),
      )
    })
  })
})
