/* eslint-disable @typescript-eslint/ban-ts-comment */
import { ObjectId } from 'bson-ext'
import { format, subDays } from 'date-fns'
import { cloneDeep, omit, times } from 'lodash'
import { ObjectID } from 'mongodb'
import mongoose from 'mongoose'
import { errAsync, okAsync } from 'neverthrow'
import SparkMD5 from 'spark-md5'
import supertest, { Session } from 'supertest-session'

import { aws } from 'src/app/config/config'
import getFormModel, {
  getEmailFormModel,
  getEncryptedFormModel,
} from 'src/app/models/form.server.model'
import getFormFeedbackModel from 'src/app/models/form_feedback.server.model'
import getSubmissionModel, {
  getEncryptSubmissionModel,
} from 'src/app/models/submission.server.model'
import getUserModel from 'src/app/models/user.server.model'
import * as AuthService from 'src/app/modules/auth/auth.service'
import {
  DatabaseError,
  DatabasePayloadSizeError,
} from 'src/app/modules/core/core.errors'
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
import { saveSubmissionMetadata } from 'src/app/modules/submission/email-submission/email-submission.service'
import { SubmissionHash } from 'src/app/modules/submission/email-submission/email-submission.types'
import { EditFieldActions } from 'src/shared/constants'
import {
  FormFieldSchema,
  IFormDocument,
  IFormSchema,
  IPopulatedEmailForm,
  IPopulatedForm,
  IUserSchema,
  SubmissionCursorData,
} from 'src/types'
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

import { VALID_UPLOAD_FILE_TYPES } from '../../../../../../shared/constants/file'
import {
  BasicField,
  FormResponseMode,
  FormStatus,
  SubmissionType,
} from '../../../../../../shared/types'
import { insertFormFeedback } from '../../public-form/public-form.service'
import { AdminFormsRouter } from '../admin-form.routes'
import * as AdminFormService from '../admin-form.service'

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
const FormFeedbackModel = getFormFeedbackModel(mongoose)
const SubmissionModel = getSubmissionModel(mongoose)
const EncryptSubmissionModel = getEncryptSubmissionModel(mongoose)

const app = setupApp(undefined, AdminFormsRouter, {
  setupWithAuth: true,
})

describe('admin-form.routes', () => {
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

  describe('POST /v2/submissions/email/preview/:formId', () => {
    const SUBMISSIONS_ENDPT_BASE = '/v2/submissions/email/preview'
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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
        .post(`${SUBMISSIONS_ENDPT_BASE}/${form._id}`)
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

  describe('POST /v2/submissions/encrypt/preview/:formId', () => {
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
        .send(MOCK_SUBMISSION_BODY)

      expect(response.body.message).toBe('Form submission successful.')
      expect(mongoose.isValidObjectId(response.body.submissionId)).toBe(true)
      expect(response.status).toBe(200)
    })

    it('should return 401 when user is not signed in', async () => {
      await logoutSession(request)

      const response = await request
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
        .send(MOCK_SUBMISSION_BODY)

      expect(response.status).toBe(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 400 when responses are not provided in body', async () => {
      const response = await request
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
        .send(omit(MOCK_SUBMISSION_BODY, 'responses'))

      expect(response.status).toBe(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'responses' } }),
      )
    })

    it('should return 400 when responses are missing _id field', async () => {
      const response = await request
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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
        .post(`/v2/submissions/encrypt/preview/${mockForm._id}`)
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

  describe('GET /adminform', () => {
    it('should return 200 with empty array when user has no forms', async () => {
      // Act
      const response = await request.get('/adminform')

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual([])
    })

    it('should return 200 with a list of forms managed by the user', async () => {
      // Arrange
      // Create separate user
      const collabUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'collab-user',
          shortName: 'collabUser',
        })
      ).user

      const ownForm = await EmailFormModel.create({
        title: 'Own form',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })
      const collabForm = await EncryptFormModel.create({
        title: 'Collab form',
        publicKey: 'some public key',
        admin: collabUser._id,
        permissionList: [{ email: defaultUser.email }],
      })
      // Create already archived form, should not be fetched even though
      // owner is defaultUser
      await EmailFormModel.create({
        title: 'Archived form',
        emails: defaultUser.email,
        admin: defaultUser._id,
        status: FormStatus.Archived,
      })
      // Create form that user is not collaborator/admin of. Should not be
      // fetched.
      await EncryptFormModel.create({
        title: 'Does not matter',
        publicKey: 'abracadabra',
        admin: collabUser._id,
        // No permissions for anyone else.
      })

      // Act
      const response = await request.get('/adminform')

      // Assert
      // Should only receive ownForm and collabForm
      const expected = await FormModel.find({
        _id: {
          $in: [ownForm._id, collabForm._id],
        },
      })
        .select('_id title admin lastModified status responseMode')
        .sort('-lastModified')
        .populate({
          path: 'admin',
          populate: {
            path: 'agency',
          },
        })
        .lean()
      expect(response.body).toEqual(jsonParseStringify(expected))
      expect(response.status).toEqual(200)
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get('/adminform')

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 422 when user of given id cannot be found in the database', async () => {
      // Arrange
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.get('/adminform')

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database errors occur', async () => {
      // Arrange
      // Mock database error.
      jest
        .spyOn(FormModel, 'getMetaByUserIdOrEmail')
        .mockRejectedValueOnce(new Error('something went wrong'))

      // Act
      const response = await request.get('/adminform')

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('POST /adminform', () => {
    it('should return 200 with newly created email mode form', async () => {
      // Arrange
      const createEmailParams = {
        form: {
          emails: defaultUser.email,
          responseMode: 'email',
          title: 'email mode form test',
          // Extra keys should be fine.
          someExtraKey: 'extra value that will be ignored.',
        },
      }

      // Act
      const response = await request.post('/adminform').send(createEmailParams)

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(
        expect.objectContaining({
          admin: String(defaultUser._id),
          emails: [defaultUser.email],
          responseMode: FormResponseMode.Email,
          status: FormStatus.Private,
          title: createEmailParams.form.title,
          form_fields: [],
          form_logics: [],
        }),
      )
    })

    it('should return 200 with newly created storage mode form', async () => {
      // Arrange
      const createStorageParams = {
        form: {
          responseMode: 'encrypt',
          title: 'storage mode form test',
          publicKey: 'some random public key',
        },
      }

      // Act
      const response = await request
        .post('/adminform')
        .send(createStorageParams)

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(
        expect.objectContaining({
          admin: String(defaultUser._id),
          publicKey: createStorageParams.form.publicKey,
          responseMode: FormResponseMode.Encrypt,
          status: FormStatus.Private,
          title: createStorageParams.form.title,
          form_fields: [],
          form_logics: [],
        }),
      )
    })

    it('should return 400 when body.form.publicKey is missing', async () => {
      // Act
      const response = await request.post('/adminform').send({
        form: {
          responseMode: 'encrypt',
          title: 'storage mode form test',
          // Missing publicKey value.
        },
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'form.publicKey' } }),
      )
    })

    it('should return 400 when body.form.responseMode is missing', async () => {
      // Act
      const response = await request.post('/adminform').send({
        form: {
          // responseMode missing.
          title: 'storage mode form test',
          emails: 'some@example.com',
        },
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'form.responseMode' } }),
      )
    })

    it('should return 400 when body.form.title is missing', async () => {
      // Act
      const response = await request.post('/adminform').send({
        form: {
          // title is missing.
          responseMode: FormResponseMode.Email,
          emails: 'some@example.com',
        },
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'form.title' } }),
      )
    })

    it('should return 400 when body.form.emails is missing when creating an email form', async () => {
      // Act
      const response = await request.post('/adminform').send({
        form: {
          title: 'new email form',
          responseMode: FormResponseMode.Email,
          // body.emails missing.
        },
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'form.emails' },
        }),
      )
    })

    it('should return 400 when body.form.emails is an empty string when creating an email form', async () => {
      // Act
      const response = await request.post('/adminform').send({
        form: {
          title: 'new email form',
          responseMode: FormResponseMode.Email,
          emails: '',
        },
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'form.emails',
            message: '"form.emails" is not allowed to be empty',
          },
        }),
      )
    })

    it('should return 400 when body.form.emails is an empty array when creating an email form', async () => {
      // Act
      const response = await request.post('/adminform').send({
        form: {
          title: 'new email form',
          responseMode: FormResponseMode.Email,
          emails: [],
        },
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'form.emails',
            message: '"form.emails" must contain at least 1 items',
          },
        }),
      )
    })

    it('should return 400 when body.form.publicKey is missing when creating a storage mode form', async () => {
      // Act
      const response = await request.post('/adminform').send({
        form: {
          title: 'new storage mode form',
          responseMode: FormResponseMode.Encrypt,
          // publicKey missing.
        },
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'form.publicKey',
          },
        }),
      )
    })

    it('should return 400 when body.form.publicKey is an empty string when creating a storage mode form', async () => {
      // Act
      const response = await request.post('/adminform').send({
        form: {
          title: 'new storage mode form',
          responseMode: FormResponseMode.Encrypt,
          publicKey: '',
        },
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'form.publicKey',
            message: '"form.publicKey" contains an invalid value',
          },
        }),
      )
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.post('/adminform').send('does not matter')

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 413 when a payload for created form exceeds the size limit', async () => {
      // Arrange
      const createStorageParams = {
        form: {
          responseMode: 'encrypt',
          title: 'storage mode form test',
          publicKey: 'some random public key',
        },
      }

      const payloadSizeError = new DatabasePayloadSizeError(
        'Creating a real > 16MB file in tests did not seem like a good idea',
      )
      jest
        .spyOn(AdminFormService, 'createForm')
        .mockReturnValueOnce(errAsync(payloadSizeError))

      // Act
      const response = await request
        .post('/adminform')
        .send(createStorageParams)

      // Assert
      expect(response.status).toEqual(413)
      expect(response.body).toEqual({ message: payloadSizeError.message })
    })

    it('should return 422 when user cannot be found in the database', async () => {
      // Arrange
      const createEmailParams = {
        form: {
          emails: defaultUser.email,
          responseMode: 'email',
          title: 'email mode form test',
        },
      }
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.post('/adminform').send(createEmailParams)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 422 when form creation results in a database validation error', async () => {
      // Arrange
      const emailParamsWithInvalidDomain = {
        form: {
          emails: defaultUser.email,
          responseMode: 'email',
          title: 'email mode form test should fail',
          permissionList: [{ email: 'invalidEmailDomain@example.com' }],
        },
      }

      // Act
      const response = await request
        .post('/adminform')
        .send(emailParamsWithInvalidDomain)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({
        message:
          'Error: [Failed to update collaborators list.]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.',
      })
    })

    it('should return 500 when database error occurs whilst creating a form', async () => {
      // Arrange
      const createStorageParams = {
        form: {
          responseMode: 'encrypt',
          title: 'storage mode form test',
          publicKey: 'some random public key',
        },
      }

      const databaseError = new DatabaseError('something went wrong')
      jest
        .spyOn(AdminFormService, 'createForm')
        .mockReturnValueOnce(errAsync(databaseError))

      // Act
      const response = await request
        .post('/adminform')
        .send(createStorageParams)

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: databaseError.message,
      })
    })
  })

  describe('GET /:formId/adminform', () => {
    it('should return 200 with retrieved form when user is admin', async () => {
      // Arrange
      const ownForm = await EmailFormModel.create({
        title: 'Own form',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(`/${ownForm._id}/adminform`)

      // Assert
      const expected = await FormModel.findById(ownForm._id)
        .populate({
          path: 'admin',
          populate: {
            path: 'agency',
          },
        })
        .lean()
      expect(response.status).toEqual(200)
      expect(response.body).not.toBeNull()
      expect(response.body).toEqual({
        form: jsonParseStringify(expected),
      })
    })

    it('should return 200 with retrieved form when user has read permissions', async () => {
      // Arrange
      // Create separate user
      const collabUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'collab-user',
          shortName: 'collabUser',
        })
      ).user

      const collabForm = await EncryptFormModel.create({
        title: 'Collab form',
        publicKey: 'some public key',
        admin: collabUser._id,
        permissionList: [{ email: defaultUser.email, write: false }],
      })

      // Act
      const response = await request.get(`/${collabForm._id}/adminform`)

      // Assert
      const expected = await FormModel.findById(collabForm._id)
        .populate({
          path: 'admin',
          populate: {
            path: 'agency',
          },
        })
        .lean()
      expect(response.status).toEqual(200)
      expect(response.body).not.toBeNull()
      expect(response.body).toEqual({
        form: jsonParseStringify(expected),
      })
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get(`/${new ObjectId()}/adminform`)

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
      const response = await request.get(`/${inaccessibleForm._id}/adminform`)

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform read operation',
        ),
      })
    })

    it('should return 404 when form cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId().toHexString()

      // Act
      const response = await request.get(`/${invalidFormId}/adminform`)

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form to retrieve is archived', async () => {
      // Arrange
      const archivedForm = await EncryptFormModel.create({
        title: 'archived form',
        status: FormStatus.Archived,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'does not matter',
        admin: defaultUser._id,
      })

      // Act
      const response = await request.get(`/${archivedForm._id}/adminform`)

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be retrieved from the database', async () => {
      // Arrange
      // Clear user collection
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.get(`/${new ObjectId()}/adminform`)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst retrieving form', async () => {
      // Arrange
      jest
        .spyOn(FormModel, 'getFullFormById')
        .mockRejectedValueOnce(new Error('some error'))

      // Act
      const response = await request.get(`/${new ObjectId()}/adminform`)

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('PUT /:formId/adminform', () => {
    // Skipping tests for these as the endpoints will be migrated soon.
    it.todo('test for every single update, reorder, duplicate, etc form fields')

    it('should return 200 with updated form when body.form.editFormField is provided', async () => {
      // Arrange
      const formToUpdate = (await EmailFormModel.create({
        title: 'Form to update',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [generateDefaultField(BasicField.Date)],
      })) as IPopulatedForm

      const updatedDescription = 'some new description'

      // Act
      const response = await request
        .put(`/${formToUpdate._id}/adminform`)
        .send({
          form: {
            editFormField: {
              action: { name: EditFieldActions.Update },
              field: {
                ...formToUpdate.form_fields[0].toObject(),
                description: updatedDescription,
              },
            },
          },
        })

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
      expect(expected?.form_fields![0].description).toEqual(updatedDescription)
      expect(expected?.__v).toEqual(1)
      expect(response.body).toEqual(jsonParseStringify(expected))
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      const formToUpdate = await EmailFormModel.create({
        title: 'Form to update',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .put(`/${formToUpdate._id}/adminform`)
        .send({
          form: { permissionList: [{ email: 'test@example.com' }] },
        })

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
      const randomForm = await EncryptFormModel.create({
        title: 'form that user has no write access to',
        admin: collabUser._id,
        publicKey: 'some random key',
        // Current user only has read access.
        permissionList: [{ email: defaultUser.email }],
      })

      // Act
      const response = await request.put(`/${randomForm._id}/adminform`).send({
        form: { permissionList: [{ email: 'test@example.com' }] },
      })

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: `User ${defaultUser.email} not authorized to perform write operation on Form ${randomForm._id} with title: ${randomForm.title}.`,
      })
    })

    it('should return 404 when form to update cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId()

      // Act
      const response = await request.put(`/${invalidFormId}/adminform`).send({
        form: { permissionList: [{ email: 'test@example.com' }] },
      })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      // Create archived form.
      const archivedForm = await EmailFormModel.create({
        title: 'Form already archived',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        status: FormStatus.Archived,
      })

      // Act
      const response = await request
        .put(`/${archivedForm._id}/adminform`)
        .send({
          form: { permissionList: [{ email: 'test@example.com' }] },
        })

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when form has invalid updates to be performed', async () => {
      // Arrange
      const formToUpdate = (await EmailFormModel.create({
        title: 'Form to update',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [generateDefaultField(BasicField.Date)],
      })) as IPopulatedForm
      // Delete field
      const clonedForm = cloneDeep(formToUpdate)
      clonedForm.form_fields = []
      await clonedForm.save()

      // Act
      const response = await request
        .put(`/${formToUpdate._id}/adminform`)
        .send({
          form: {
            editFormField: {
              action: { name: EditFieldActions.Update },
              field: {
                ...formToUpdate.form_fields[0].toObject(),
                description: 'some new description',
              },
            },
          },
        })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({
        message: 'Field to be updated does not exist',
      })
    })

    it('should return 422 when user in session cannot be found in the database', async () => {
      // Arrange
      const formToArchive = await EmailFormModel.create({
        title: 'Form to archive',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request
        .put(`/${formToArchive._id}/adminform`)
        .send({
          form: { permissionList: [{ email: 'test@example.com' }] },
        })

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
      })) as IPopulatedForm
      formToUpdate.save = jest
        .fn()
        .mockRejectedValue(new Error('something happened'))

      jest
        .spyOn(AuthService, 'getFormAfterPermissionChecks')
        .mockReturnValue(okAsync(formToUpdate))

      // Act
      const response = await request
        .put(`/${formToUpdate._id}/adminform`)
        .send({
          form: { permissionList: [{ email: 'test@example.com' }] },
        })

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message:
          'Error: [something happened]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.',
      })
    })
  })

  describe('DELETE /:formId/adminform', () => {
    it('should return 200 with success message when form is successfully archived', async () => {
      // Arrange
      const formToArchive = await EmailFormModel.create({
        title: 'Form to archive',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })
      expect(formToArchive.status).toEqual(FormStatus.Private)

      // Act
      const response = await request.delete(`/${formToArchive._id}/adminform`)

      // Assert
      const form = await EmailFormModel.findById(formToArchive._id)
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({ message: 'Form has been archived' })
      expect(form?.status).toEqual(FormStatus.Archived)
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)
      const formToArchive = await EmailFormModel.create({
        title: 'Form to archive',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      // Act
      const response = await request.delete(`/${formToArchive._id}/adminform`)

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have permissions to archive form', async () => {
      // Arrange
      // Create separate user
      const collabUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'collab-user',
          shortName: 'collabUser',
        })
      ).user
      const randomForm = await EncryptFormModel.create({
        title: 'form that user has no delete access to',
        admin: collabUser._id,
        publicKey: 'some random key',
        // Current user only has write access but not admin.
        permissionList: [{ email: defaultUser.email, write: true }],
      })

      // Act
      const response = await request.delete(`/${randomForm._id}/adminform`)

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: `User ${defaultUser.email} not authorized to perform delete operation on Form ${randomForm._id} with title: ${randomForm.title}.`,
      })
    })

    it('should return 404 when form to archive cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId()

      // Act
      const response = await request.delete(`/${invalidFormId}/adminform`)

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      // Create archived form.
      const archivedForm = await EmailFormModel.create({
        title: 'Form already archived',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        status: FormStatus.Archived,
      })

      // Act
      const response = await request.delete(`/${archivedForm._id}/adminform`)

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be found in the database', async () => {
      // Arrange
      const formToArchive = await EmailFormModel.create({
        title: 'Form to archive',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.delete(`/${formToArchive._id}/adminform`)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst archiving form', async () => {
      // Arrange
      const formToArchive = await EmailFormModel.create({
        title: 'Form to archive',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })
      // Mock database error during archival.
      jest
        .spyOn(AdminFormService, 'archiveForm')
        .mockReturnValueOnce(errAsync(new DatabaseError()))

      // Act
      const response = await request.delete(`/${formToArchive._id}/adminform`)

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('POST /:formId/adminform', () => {
    it('should return 200 with the duplicated form dashboard view', async () => {
      // Arrange
      // Create form.
      const formToDupe = await EmailFormModel.create({
        title: 'Original form title',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      const dupeParams = {
        responseMode: FormResponseMode.Encrypt,
        title: 'new duplicated form title',
        publicKey: 'some public key',
      }

      // Act
      const response = await request
        .post(`/${formToDupe._id}/adminform`)
        .send(dupeParams)

      // Assert
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          admin: expect.objectContaining({
            _id: String(defaultUser._id),
          }),
          responseMode: dupeParams.responseMode,
          title: dupeParams.title,
          status: FormStatus.Private,
        }),
      )
    })

    it('should return 400 when body.emails is missing when duplicating to an email form', async () => {
      // Arrange
      const formToDupe = await EncryptFormModel.create({
        title: 'some form',
        admin: defaultUser._id,
        publicKey: 'some random key',
      })

      // Act
      const response = await request.post(`/${formToDupe._id}/adminform`).send({
        title: 'new email form',
        responseMode: FormResponseMode.Email,
        // body.emails missing.
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'emails' },
        }),
      )
    })

    it('should return 400 when body.emails is an empty string when duplicating to an email form', async () => {
      // Arrange
      const formToDupe = await EncryptFormModel.create({
        title: 'some form',
        admin: defaultUser._id,
        publicKey: 'some random key',
      })

      // Act
      const response = await request.post(`/${formToDupe._id}/adminform`).send({
        title: 'new email form',
        responseMode: FormResponseMode.Email,
        emails: '',
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'emails',
            message: '"emails" is not allowed to be empty',
          },
        }),
      )
    })

    it('should return 400 when body.emails is an empty array when duplicating to an email form', async () => {
      // Arrange
      const formToDupe = await EncryptFormModel.create({
        title: 'some form',
        admin: defaultUser._id,
        publicKey: 'some random key',
      })

      // Act
      const response = await request.post(`/${formToDupe._id}/adminform`).send({
        title: 'new email form',
        responseMode: FormResponseMode.Email,
        emails: [],
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'emails',
            message: '"emails" must contain at least 1 items',
          },
        }),
      )
    })

    it('should return 400 when body.publicKey is missing when duplicating to a storage mode form', async () => {
      // Arrange
      const formToDupe = await EncryptFormModel.create({
        title: 'some form',
        admin: defaultUser._id,
        publicKey: 'some random key',
      })

      // Act
      const response = await request.post(`/${formToDupe._id}/adminform`).send({
        title: 'new storage mode form',
        responseMode: FormResponseMode.Encrypt,
        // publicKey missing.
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'publicKey',
          },
        }),
      )
    })

    it('should return 400 when body.publicKey is an empty string when duplicating to a storage mode form', async () => {
      // Arrange
      const formToDupe = await EncryptFormModel.create({
        title: 'some form',
        admin: defaultUser._id,
        publicKey: 'some random key',
      })

      // Act
      const response = await request.post(`/${formToDupe._id}/adminform`).send({
        title: 'new storage mode form',
        responseMode: FormResponseMode.Encrypt,
        publicKey: '',
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'publicKey',
            message: '"publicKey" contains an invalid value',
          },
        }),
      )
    })

    it('should return 400 when body.title is missing', async () => {
      // Arrange
      const formToDupe = await EncryptFormModel.create({
        title: 'some form',
        admin: defaultUser._id,
        publicKey: 'some random key',
      })

      // Act
      const response = await request.post(`/${formToDupe._id}/adminform`).send({
        // title is missing.
        responseMode: FormResponseMode.Email,
        emails: 'test@example.com',
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'title' },
        }),
      )
    })

    it('should return 400 when body.responseMode is missing', async () => {
      // Arrange
      const formToDupe = await EncryptFormModel.create({
        title: 'some form',
        admin: defaultUser._id,
        publicKey: 'some random key',
      })

      // Act
      const response = await request.post(`/${formToDupe._id}/adminform`).send({
        title: 'something',
        // responseMode missing.
        emails: 'test@example.com',
      })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'responseMode' },
        }),
      )
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)
      // Create form.
      const formToDupe = await EmailFormModel.create({
        title: 'Original form title',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      // Act
      const response = await request
        .post(`/${formToDupe._id}/adminform`)
        .send('does not matter')

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when user does not have read permissions to form', async () => {
      // Arrange
      // Create separate user
      const someUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      const randomForm = await EncryptFormModel.create({
        title: 'form that user has no delete access to',
        admin: someUser._id,
        publicKey: 'some random key',
        // Current user has no access to this form,
        permissionList: [],
      })

      // Act
      const response = await request.post(`/${randomForm._id}/adminform`).send({
        responseMode: FormResponseMode.Encrypt,
        title: 'new duplicated form title',
        publicKey: 'some public key',
      })

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: `User ${defaultUser.email} not authorized to perform read operation on Form ${randomForm._id} with title: ${randomForm.title}.`,
      })
    })

    it('should return 404 when form to duplicate cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId()

      // Act
      const response = await request.post(`/${invalidFormId}/adminform`).send({
        responseMode: FormResponseMode.Encrypt,
        title: 'new duplicated form title',
        publicKey: 'some public key',
      })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when form is already archived', async () => {
      // Arrange
      // Create archived form.
      const archivedForm = await EmailFormModel.create({
        title: 'Form already archived',
        emails: [defaultUser.email],
        admin: defaultUser._id,
        status: FormStatus.Archived,
      })

      // Act
      const response = await request
        .post(`/${archivedForm._id}/adminform`)
        .send({
          responseMode: FormResponseMode.Email,
          emails: 'anyrandomEmail@example.com',
          title: 'cool new title',
        })

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when user in session cannot be found in the database', async () => {
      // Arrange
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request.post(`/${new ObjectId()}/adminform`).send({
        responseMode: FormResponseMode.Encrypt,
        title: 'does not matter',
        publicKey: 'some public key',
      })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst duplicating form', async () => {
      // Arrange
      // Create form.
      const formToDupe = await EmailFormModel.create({
        title: 'Original form title',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })

      // Force validation error that will be returned as database error
      // TODO(#614): Return transformMongoError instead of DatabaseError for better mongoose error handling.
      const invalidEmailDupeParams = {
        responseMode: FormResponseMode.Email,
        emails: 'notAnEmail, should return error',
        title: 'cool new title',
      }

      // Act
      const response = await request
        .post(`/${formToDupe._id}/adminform`)
        .send(invalidEmailDupeParams)

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'Please provide valid email addresses',
        ),
      })
    })
  })

  describe('POST /:formId/adminform/transfer-owner', () => {
    it('should return 200 with updated form and owner transferred', async () => {
      // Arrange
      const formToTransfer = await EmailFormModel.create({
        title: 'Original form title',
        emails: [defaultUser.email],
        admin: defaultUser._id,
      })
      const newOwner = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'new-owner',
          shortName: 'newOwner',
        })
      ).user

      // Act
      const response = await request
        .post(`/${formToTransfer._id}/adminform/transfer-owner`)
        .send({
          email: newOwner.email,
        })

      // Assert
      const expected = {
        form: expect.objectContaining({
          _id: String(formToTransfer._id),
          // Admin should be new owner.
          admin: expect.objectContaining({
            _id: String(newOwner._id),
          }),
          // Original owner should still have write permissions.
          permissionList: [
            expect.objectContaining({
              email: defaultUser.email,
              write: true,
            }),
          ],
        }),
      }
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expected)
    })

    it('should return 400 when body.email is missing', async () => {
      // Arrange
      const someFormId = new ObjectId().toHexString()

      // Act
      const response = await request
        .post(`/${someFormId}/adminform/transfer-owner`)
        // Missing email.
        .send({})

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({ body: { key: 'email' } }),
      )
    })

    it('should return 400 when body.email is an invalid email', async () => {
      // Arrange
      const someFormId = new ObjectId().toHexString()

      // Act
      const response = await request
        .post(`/${someFormId}/adminform/transfer-owner`)
        .send({ email: 'not an email' })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'email', message: 'Please enter a valid email' },
        }),
      )
    })

    it('should return 400 when body.email contains multiple emails', async () => {
      // Arrange
      const someFormId = new ObjectId().toHexString()

      // Act
      const response = await request
        .post(`/${someFormId}/adminform/transfer-owner`)
        .send({ email: 'first@example.com,second@example.com' })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'email', message: 'Please enter a valid email' },
        }),
      )
    })

    it('should return 400 when the new owner is not in the database', async () => {
      // Arrange
      const emailNotInDb = 'notInDb@example.com'
      const formToTransfer = await EncryptFormModel.create({
        title: 'Original form title',
        admin: defaultUser._id,
        publicKey: 'some public key',
      })

      // Act
      const response = await request
        .post(`/${formToTransfer._id}/adminform/transfer-owner`)
        .send({ email: emailNotInDb })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual({
        message: `${emailNotInDb} must have logged in once before being added as Owner`,
      })
    })

    it('should return 400 when the new owner is already the current owner', async () => {
      // Arrange
      const formToTransfer = await EncryptFormModel.create({
        title: 'Original form title',
        admin: defaultUser._id,
        publicKey: 'some public key',
      })

      // Act
      const response = await request
        .post(`/${formToTransfer._id}/adminform/transfer-owner`)
        .send({ email: defaultUser.email })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual({
        message: 'You are already the owner of this form',
      })
    })

    it('should return 403 when current user is not the owner of the form', async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      const yetAnotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'anotheranother-user',
          shortName: 'someOtherUser',
        })
      ).user
      const notOwnerForm = await EmailFormModel.create({
        title: 'Original form title',
        emails: [anotherUser.email],
        admin: anotherUser._id,
      })

      // Act
      const response = await request
        .post(`/${notOwnerForm._id}/adminform/transfer-owner`)
        .send({ email: yetAnotherUser.email })

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: expect.stringContaining(
          'not authorized to perform delete operation',
        ),
      })
    })

    it('should return 404 when form to transfer cannot be found', async () => {
      // Arrange
      const invalidFormId = new ObjectId().toHexString()
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user

      // Act
      const response = await request
        .post(`/${invalidFormId}/adminform/transfer-owner`)
        .send({ email: anotherUser.email })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: 'Form not found',
      })
    })

    it('should return 410 when the form to transfer is already archived', async () => {
      // Arrange
      const archivedForm = await EncryptFormModel.create({
        title: 'Original form title',
        admin: defaultUser._id,
        publicKey: 'some public key',
        // Already deleted.
        status: FormStatus.Archived,
      })
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user

      // Act
      const response = await request
        .post(`/${archivedForm._id}/adminform/transfer-owner`)
        .send({ email: anotherUser.email })

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({ message: 'Form has been archived' })
    })

    it('should return 422 when the user in session cannot be retrieved from the database', async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      const formToTransfer = await EncryptFormModel.create({
        title: 'Original form title',
        admin: defaultUser._id,
        publicKey: 'some public key',
      })
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request
        .post(`/${formToTransfer._id}/adminform/transfer-owner`)
        .send({ email: anotherUser.email })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })

  describe('GET /:formId/adminform/template', () => {
    it("should return 200 with target form's public view", async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      // Create public form
      const publicForm = await FormModel.create({
        title: 'some public form',
        status: FormStatus.Public,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: anotherUser._id,
        form_fields: [
          generateDefaultField(BasicField.Date),
          generateDefaultField(BasicField.Nric),
        ],
      })

      // Act
      const response = await request.get(
        `/${publicForm._id}/adminform/template`,
      )

      // Assert
      const populatedForm = await publicForm
        .populate({ path: 'admin', populate: { path: 'agency' } })
        .execPopulate()
      expect(response.status).toEqual(200)
      expect(response.body).toEqual({
        form: jsonParseStringify(populatedForm.getPublicView()),
      })
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.get(
        `/${new ObjectId()}/adminform/template`,
      )

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when the target form is private', async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      // Create private form
      const privateForm = await FormModel.create({
        title: 'some private form',
        status: FormStatus.Private,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: anotherUser._id,
        form_fields: [generateDefaultField(BasicField.Nric)],
      })

      // Act
      const response = await request.get(
        `/${privateForm._id}/adminform/template`,
      )

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        formTitle: privateForm.title,
        isPageFound: true,
        message: expect.any(String),
      })
    })

    it('should return 404 when the form cannot be found', async () => {
      // Act
      const response = await request.get(
        `/${new ObjectId()}/adminform/template`,
      )

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({ message: 'Form not found' })
    })

    it('should return 410 when the form is already archived', async () => {
      // Arrange
      const anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      const archivedForm = await FormModel.create({
        title: 'some archived form',
        status: FormStatus.Archived,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: anotherUser._id,
        form_fields: [generateDefaultField(BasicField.Nric)],
      })

      // Act
      const response = await request.get(
        `/${archivedForm._id}/adminform/template`,
      )

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({
        message: 'This form is no longer active',
      })
    })

    it('should return 500 when database error occurs whilst retrieving form', async () => {
      // Arrange
      const formToRetrieve = await FormModel.create({
        title: 'some form',
        status: FormStatus.Public,
        responseMode: FormResponseMode.Email,
        emails: [defaultUser.email],
        admin: defaultUser._id,
        form_fields: [generateDefaultField(BasicField.Nric)],
      })
      // Mock database error.
      jest
        .spyOn(FormModel, 'getFullFormById')
        .mockRejectedValueOnce(new Error('something went wrong'))

      // Act
      const response = await request.get(
        `/${formToRetrieve._id}/adminform/template`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('POST /:formId/adminform/copy', () => {
    let formToCopy: IFormDocument
    let anotherUser: IUserSchema

    beforeEach(async () => {
      anotherUser = (
        await dbHandler.insertFormCollectionReqs({
          userId: new ObjectId(),
          mailName: 'some-user',
          shortName: 'someUser',
        })
      ).user
      formToCopy = (await EncryptFormModel.create({
        title: 'some form',
        admin: anotherUser._id,
        publicKey: 'some random key',
        // Must be public to copy
        status: FormStatus.Public,
      })) as IFormDocument
    })

    it('should return 200 with duplicated form dashboard view when copying to an email mode form', async () => {
      // Act
      const bodyParams = {
        title: 'some title',
        responseMode: FormResponseMode.Email,
        emails: [defaultUser.email],
      }
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send(bodyParams)

      // Assert
      const expected = expect.objectContaining({
        _id: expect.any(String),
        admin: expect.objectContaining({
          _id: defaultUser.id,
        }),
        title: bodyParams.title,
        responseMode: bodyParams.responseMode,
      })
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expected)
    })

    it('should return 200 with duplicated form dashboard view when copying to a storage mode form', async () => {
      // Act
      const bodyParams = {
        title: 'some other title',
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
      }
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send(bodyParams)

      // Assert
      const expected = expect.objectContaining({
        _id: expect.any(String),
        admin: expect.objectContaining({
          _id: defaultUser.id,
        }),
        title: bodyParams.title,
        responseMode: bodyParams.responseMode,
      })
      expect(response.status).toEqual(200)
      expect(response.body).toEqual(expected)
    })

    it('should return 400 when body.responseMode is missing', async () => {
      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'some title',
          // body.responseMode is missing
          emails: [defaultUser.email],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'responseMode' },
        }),
      )
    })

    it('should return 400 when body.responseMode is invalid', async () => {
      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'some title',
          responseMode: 'some rubbish',
          emails: [defaultUser.email],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'responseMode',
            message: `"responseMode" must be one of [${Object.values(
              FormResponseMode,
            ).join(', ')}]`,
          },
        }),
      )
    })

    it('should return 400 when body.title is missing', async () => {
      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          // body.title missing
          responseMode: FormResponseMode.Email,
          emails: [defaultUser.email],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'title' },
        }),
      )
    })

    it('should return 400 when body.emails is missing when copying to an email form', async () => {
      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'new email form',
          responseMode: FormResponseMode.Email,
          // body.emails missing.
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: { key: 'emails' },
        }),
      )
    })

    it('should return 400 when body.emails is an empty string when copying to an email form', async () => {
      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'new email form',
          responseMode: FormResponseMode.Email,
          emails: '',
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'emails',
            message: '"emails" is not allowed to be empty',
          },
        }),
      )
    })

    it('should return 400 when body.emails is an empty array when copying to an email form', async () => {
      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'new email form',
          responseMode: FormResponseMode.Email,
          emails: [],
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'emails',
            message: '"emails" must contain at least 1 items',
          },
        }),
      )
    })

    it('should return 400 when body.publicKey is missing when copying to a storage mode form', async () => {
      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'new storage mode form',
          responseMode: FormResponseMode.Encrypt,
          // publicKey missing.
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'publicKey',
          },
        }),
      )
    })

    it('should return 400 when body.publicKey is an empty string when copying to a storage mode form', async () => {
      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'new storage mode form',
          responseMode: FormResponseMode.Encrypt,
          publicKey: '',
        })

      // Assert
      expect(response.status).toEqual(400)
      expect(response.body).toEqual(
        buildCelebrateError({
          body: {
            key: 'publicKey',
            message: '"publicKey" contains an invalid value',
          },
        }),
      )
    })

    it('should return 401 when user is not logged in', async () => {
      // Arrange
      await logoutSession(request)

      // Act
      const response = await request.post(`/${new ObjectId()}/adminform/copy`)

      // Assert
      expect(response.status).toEqual(401)
      expect(response.body).toEqual({ message: 'User is unauthorized.' })
    })

    it('should return 403 when form to copy is private', async () => {
      // Arrange
      const bodyParams = {
        title: 'some title',
        responseMode: FormResponseMode.Email,
        emails: [defaultUser.email],
      }
      // Create private form
      const privateForm = await FormModel.create({
        title: 'some private form',
        status: FormStatus.Private,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'some public key',
        admin: anotherUser._id,
        form_fields: [generateDefaultField(BasicField.Nric)],
      })

      // Act
      const response = await request
        .post(`/${privateForm._id}/adminform/copy`)
        .send(bodyParams)

      // Assert
      expect(response.status).toEqual(403)
      expect(response.body).toEqual({
        message: 'Form must be public to be copied',
      })
    })

    it('should return 404 when the form cannot be found', async () => {
      // Act
      const response = await request
        .post(`/${new ObjectId()}/adminform/copy`)
        .send({
          title: 'some new title',
          responseMode: FormResponseMode.Encrypt,
          publicKey: 'booyeah',
        })

      // Assert
      expect(response.status).toEqual(404)
      expect(response.body).toEqual({
        message: 'Form not found',
      })
    })

    it('should return 410 when the form to copy is archived', async () => {
      // Arrange
      // Create archived form.
      // Arrange
      const archivedForm = await EncryptFormModel.create({
        title: 'archived form',
        status: FormStatus.Archived,
        responseMode: FormResponseMode.Encrypt,
        publicKey: 'does not matter',
        admin: anotherUser._id,
      })

      // Act
      const response = await request
        .post(`/${archivedForm._id}/adminform/copy`)
        .send({
          title: 'some new title',
          responseMode: FormResponseMode.Encrypt,
          publicKey: 'booyeah',
        })

      // Assert
      expect(response.status).toEqual(410)
      expect(response.body).toEqual({
        message: 'This form is no longer active',
      })
    })

    it('should return 422 when the user in session cannot be retrieved from the database', async () => {
      // Arrange
      // Delete user after login.
      await dbHandler.clearCollection(UserModel.collection.name)

      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'some new title',
          responseMode: FormResponseMode.Encrypt,
          publicKey: 'booyeah',
        })

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })

    it('should return 500 when database error occurs whilst copying form', async () => {
      // Arrange
      // Mock database error.
      const mockErrorString = 'something went wrong'
      jest
        .spyOn(FormModel, 'create')
        // @ts-ignore
        .mockRejectedValueOnce(new Error(mockErrorString))

      // Act
      const response = await request
        .post(`/${formToCopy._id}/adminform/copy`)
        .send({
          title: 'some new title',
          responseMode: FormResponseMode.Encrypt,
          publicKey: 'booyeah',
        })

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: `Error: [${mockErrorString}]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.`,
      })
    })
  })

  describe('GET /:formId/adminform/preview', () => {
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
        `/${formToPreview._id}/adminform/preview`,
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
        `/${collabFormToPreview._id}/adminform/preview`,
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
        `/${unauthedForm._id}/adminform/preview`,
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
      const response = await request.get(`/${new ObjectId()}/adminform/preview`)

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
        `/${archivedForm._id}/adminform/preview`,
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
        `/${formToPreview._id}/adminform/preview`,
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
        `/${formToPreview._id}/adminform/preview`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('GET /:formId/adminform/feedback', () => {
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
        `/${formForFeedback._id}/adminform/feedback`,
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
        `/${formForFeedback._id}/adminform/feedback`,
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
        `/${formForFeedback._id}/adminform/feedback`,
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
        `/${inaccessibleForm._id}/adminform/feedback`,
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
        `/${new ObjectId()}/adminform/feedback`,
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
        `/${archivedForm._id}/adminform/feedback`,
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
        `/${formForFeedback._id}/adminform/feedback`,
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
        `/${formForFeedback._id}/adminform/feedback`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message:
          'Error: [something went wrong]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.',
      })
    })
  })

  describe('GET /:formId/adminform/feedback/count', () => {
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
        `/${formForFeedback._id}/adminform/feedback/count`,
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
        `/${formForFeedback._id}/adminform/feedback/count`,
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
        `/${formForFeedback._id}/adminform/feedback/count`,
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
        `/${inaccessibleForm._id}/adminform/feedback/count`,
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
        `/${new ObjectId()}/adminform/feedback/count`,
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
        `/${archivedForm._id}/adminform/feedback/count`,
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
        `/${formForFeedback._id}/adminform/feedback/count`,
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
        `/${formForFeedback._id}/adminform/feedback/count`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message:
          'Error: [something went wrong]. Please refresh and try again. If you still need help, email us at form@open.gov.sg.',
      })
    })
  })

  describe('GET /:formId/adminform/feedback/download', () => {
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
        .get(`/${formForFeedback._id}/adminform/feedback/download`)
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
        .get(`/${formForFeedback._id}/adminform/feedback/download`)
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
        `/${formForFeedback._id}/adminform/feedback/download`,
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
        `/${inaccessibleForm._id}/adminform/feedback/download`,
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
        `/${new ObjectId()}/adminform/feedback/download`,
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
        `/${archivedForm._id}/adminform/feedback/download`,
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
        `/${formForFeedback._id}/adminform/feedback`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })

  describe('GET /:formId/adminform/submissions', () => {
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
      const response = await request
        .get(`/${defaultForm._id}/adminform/submissions`)
        .query({
          submissionId: String(submission._id),
        })

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
      const response = await request
        .get(`/${defaultForm._id}/adminform/submissions`)
        .query({
          submissionId: String(submission._id),
        })

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
      const response = await request
        .get(`/${emailForm._id}/adminform/submissions`)
        .query({
          submissionId: String(new ObjectId()),
        })

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
      const response = await request
        .get(`/${defaultForm._id}/adminform/submissions`)
        .query({
          submissionId: String(new ObjectId()),
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
        .get(`/${inaccessibleForm._id}/adminform/submissions`)
        .query({
          submissionId: String(new ObjectId()),
        })

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
      const response = await request
        .get(`/${defaultForm._id}/adminform/submissions`)
        .query({
          submissionId: String(new ObjectId()),
        })

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
      const response = await request
        .get(`/${invalidFormId}/adminform/submissions`)
        .query({
          submissionId: String(new ObjectId()),
        })

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
      const response = await request
        .get(`/${archivedForm._id}/adminform/submissions`)
        .query({
          submissionId: String(new ObjectId()),
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
        .get(`/${new ObjectId()}/adminform/submissions`)
        .query({
          submissionId: String(new ObjectId()),
        })

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
      const response = await request
        .get(`/${defaultForm._id}/adminform/submissions`)
        .query({
          submissionId: String(submission._id),
        })

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
      const response = await request
        .get(`/${defaultForm._id}/adminform/submissions`)
        .query({
          submissionId: String(submission._id),
        })

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Failed to create attachment URL',
      })
    })
  })

  describe('GET /:formId/adminform/submissions/count', () => {
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
        `/${newForm._id}/adminform/submissions/count`,
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
        `/${newForm._id}/adminform/submissions/count`,
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
        `/${newForm._id}/adminform/submissions/count`,
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
        `/${newForm._id}/adminform/submissions/count`,
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
      // Update first submission to be 5 days ago.
      const now = new Date()
      const firstSubmission = results[0]._unsafeUnwrap()
      firstSubmission.created = subDays(now, 5)
      await firstSubmission.save()

      // Act
      const response = await request
        .get(`/${newForm._id}/adminform/submissions/count`)
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
        .get(`/${newForm._id}/adminform/submissions/count`)
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
        .get(`/${newForm._id}/adminform/submissions/count`)
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
        .get(`/${newForm._id}/adminform/submissions/count`)
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
        .get(`/${newForm._id}/adminform/submissions/count`)
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
        .get(`/${newForm._id}/adminform/submissions/count`)
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
        .get(`/${newForm._id}/adminform/submissions/count`)
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
        `/${new ObjectId()}/adminform/submissions/count`,
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
        `/${inaccessibleForm._id}/adminform/submissions/count`,
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
        `/${invalidFormId}/adminform/submissions/count`,
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
        `/${archivedForm._id}/adminform/submissions/count`,
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
        `/${new ObjectId()}/adminform/submissions/count`,
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
        `/${form._id}/adminform/submissions/count`,
      )

      // Assert
      expect(response.status).toEqual(500)
      expect(response.body).toEqual({
        message: 'Something went wrong. Please try again.',
      })
    })
  })

  describe('GET /:formId/adminform/submissions/metadata', () => {
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
        .get(`/${defaultForm._id}/adminform/submissions/metadata`)
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
        .get(`/${defaultForm._id}/adminform/submissions/metadata`)
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
        .get(`/${defaultForm._id}/adminform/submissions/metadata`)
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
        .get(`/${defaultForm._id}/adminform/submissions/metadata`)
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
        .get(`/${defaultForm._id}/adminform/submissions/metadata`)
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
        .get(`/${inaccessibleForm._id}/adminform/submissions/metadata`)
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
        .get(`/${invalidFormId}/adminform/submissions/metadata`)
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
        .get(`/${archivedForm._id}/adminform/submissions/metadata`)
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
        .get(`/${new ObjectId()}/adminform/submissions/metadata`)
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
        .get(`/${defaultForm._id}/adminform/submissions/metadata`)
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
        .get(`/${defaultForm._id}/adminform/submissions/metadata`)
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

  describe('GET /:formId/adminform/submissions/download', () => {
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
        .get(`/${defaultForm._id}/adminform/submissions/download`)
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
        .get(`/${defaultForm._id}/adminform/submissions/download`)
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
        .get(`/${defaultForm._id}/adminform/submissions/download`)
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
        `/${emailForm._id}/adminform/submissions/download`,
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
        `/${defaultForm._id}/adminform/submissions/download`,
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
        `/${inaccessibleForm._id}/adminform/submissions/download`,
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
        `/${invalidFormId}/adminform/submissions/download`,
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
        `/${archivedForm._id}/adminform/submissions/download`,
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
        `/${new ObjectId()}/adminform/submissions/download`,
      )

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })

  describe('POST /:formId/adminform/images', () => {
    const DEFAULT_POST_PARAMS = {
      fileId: 'some file id',
      fileMd5Hash: SparkMD5.hash('test file name'),
      fileType: VALID_UPLOAD_FILE_TYPES[0],
    }

    it('should return 200 with presigned POST URL object and append an objectId to the key', async () => {
      // Arrange
      const form = await EncryptFormModel.create({
        title: 'form',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })

      // Act
      const response = await request
        .post(`/${form._id}/adminform/images`)
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
        .post(`/${form._id}/adminform/images`)
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
        .post(`/${new ObjectId()}/adminform/images`)
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
        .post(`/${new ObjectId()}/adminform/images`)
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
        .post(`/${new ObjectId()}/adminform/images`)
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
        .post(`/${new ObjectId()}/adminform/images`)
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
        .post(`/${new ObjectId()}/adminform/images`)
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
        .post(`/${new ObjectId()}/adminform/images`)
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
        .post(`/${form._id}/adminform/images`)
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
        .post(`/${invalidFormId}/adminform/images`)
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
        .post(`/${archivedForm._id}/adminform/images`)
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
        .post(`/${new ObjectId()}/adminform/images`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
    })
  })

  describe('POST /:formId/adminform/logos', () => {
    const DEFAULT_POST_PARAMS = {
      fileId: 'some other file id',
      fileMd5Hash: SparkMD5.hash('test file name again'),
      fileType: VALID_UPLOAD_FILE_TYPES[2],
    }

    it('should return 200 with presigned POST URL object and append an objectId to the key', async () => {
      // Arrange
      const form = await EncryptFormModel.create({
        title: 'form',
        admin: defaultUser._id,
        publicKey: 'does not matter',
      })

      // Act
      const response = await request
        .post(`/${form._id}/adminform/logos`)
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
        .post(`/${form._id}/adminform/logos`)
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
        .post(`/${new ObjectId()}/adminform/logos`)
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
        .post(`/${new ObjectId()}/adminform/logos`)
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
        .post(`/${new ObjectId()}/adminform/logos`)
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
        .post(`/${new ObjectId()}/adminform/logos`)
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
        .post(`/${new ObjectId()}/adminform/logos`)
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
        .post(`/${new ObjectId()}/adminform/logos`)
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
        .post(`/${form._id}/adminform/logos`)
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
        .post(`/${invalidFormId}/adminform/logos`)
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
        .post(`/${archivedForm._id}/adminform/logos`)
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
        .post(`/${new ObjectId()}/adminform/logos`)
        .send(DEFAULT_POST_PARAMS)

      // Assert
      expect(response.status).toEqual(422)
      expect(response.body).toEqual({ message: 'User not found' })
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
