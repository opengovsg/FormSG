import { generateSingleAnswerFormData } from '__tests__/unit/backend/helpers/generate-email-data'
import {
  generateNewAttachmentResponse,
  generateNewSingleAnswerResponse,
} from '__tests__/unit/backend/helpers/generate-form-data'
import dbHandler from '__tests__/unit/backend/helpers/jest-db'
import { ObjectId } from 'bson'
import crypto from 'crypto'
import { readFileSync } from 'fs'
import { omit } from 'lodash'
import mongoose from 'mongoose'

import { getEmailSubmissionModel } from 'src/app/models/submission.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import {
  IEmailFormSchema,
  IEmailSubmissionSchema,
  IPopulatedEmailForm,
} from 'src/types'

import {
  BasicField,
  FormAuthType,
  SubmissionType,
} from '../../../../../../shared/types'
import { ProcessedSingleAnswerResponse } from '../../submission.types'
import {
  DIGEST_TYPE,
  HASH_ITERATIONS,
  KEY_LENGTH,
  SALT_LENGTH,
} from '../email-submission.constants'
import {
  AttachmentTooLargeError,
  InvalidFileExtensionError,
} from '../email-submission.errors'
import * as EmailSubmissionService from '../email-submission.service'

type ResolvedValue<T> = T extends PromiseLike<infer U> ? U | T : never

const MOCK_SALT = Buffer.from('salt')
const MOCK_HASH = Buffer.from('mockHash')

const EmailSubmissionModel = getEmailSubmissionModel(mongoose)

describe('email-submission.service', () => {
  beforeAll(async () => await dbHandler.connect())
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  describe('createEmailSubmissionWithoutSave', () => {
    const MOCK_EMAIL = 'a@abc.com'
    const MOCK_RESPONSE_HASH = 'mockHash'
    const MOCK_RESPONSE_SALT = 'mockSalt'
    const MOCK_FORM = {
      admin: new ObjectId(),
      _id: new ObjectId(),
      title: 'mock title',
      getUniqueMyInfoAttrs: () => [],
      authType: 'NIL',
      emails: [MOCK_EMAIL],
    } as unknown as IPopulatedEmailForm

    it('should create a new submission without saving it to the database', async () => {
      const result = EmailSubmissionService.createEmailSubmissionWithoutSave(
        MOCK_FORM,
        MOCK_RESPONSE_HASH,
        MOCK_RESPONSE_SALT,
      )
      const foundInDatabase = await EmailSubmissionModel.findOne({
        _id: result._id,
      })

      expect(result.form).toEqual(MOCK_FORM._id)
      expect(result.responseHash).toEqual(MOCK_RESPONSE_HASH)
      expect(result.responseSalt).toEqual(MOCK_RESPONSE_SALT)
      expect(foundInDatabase).toBeNull()
    })
  })

  describe('validateAttachments', () => {
    it('should reject submissions when attachments are more than 7MB', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: Buffer.alloc(3000001),
      })
      const processedResponse2 = generateNewAttachmentResponse({
        content: Buffer.alloc(4000000),
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])
      const response2 = omit(processedResponse2, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await EmailSubmissionService.validateAttachments([
        response1,
        response2,
      ])
      expect(result._unsafeUnwrapErr()).toEqual(new AttachmentTooLargeError())
    })

    it('should reject submissions when file types are invalid', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: readFileSync('./__tests__/unit/backend/resources/invalid.py'),
        filename: 'invalid.py',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await EmailSubmissionService.validateAttachments([
        response1,
      ])
      expect(result._unsafeUnwrapErr()).toEqual(new InvalidFileExtensionError())
    })

    it('should reject submissions when there are invalid file types in zip', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: readFileSync(
          './__tests__/unit/backend/resources/nestedInvalid.zip',
        ),
        filename: 'nestedInvalid.zip',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await EmailSubmissionService.validateAttachments([
        response1,
      ])
      expect(result._unsafeUnwrapErr()).toEqual(new InvalidFileExtensionError())
    })

    it('should accept submissions when file types are valid', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: readFileSync('./__tests__/unit/backend/resources/govtech.jpg'),
        filename: 'govtech.jpg',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await EmailSubmissionService.validateAttachments([
        response1,
      ])
      expect(result._unsafeUnwrap()).toEqual(true)
    })

    it('should accept submissions when file types in zip are valid', async () => {
      const processedResponse1 = generateNewAttachmentResponse({
        content: readFileSync(
          './__tests__/unit/backend/resources/nestedValid.zip',
        ),
        filename: 'nestedValid.zip',
      })

      // Omit attributes only present in processed fields
      const response1 = omit(processedResponse1, [
        'isVisible',
        'isUserVerified',
      ])

      const result = await EmailSubmissionService.validateAttachments([
        response1,
      ])
      expect(result._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('hashSubmission', () => {
    beforeEach(() => jest.clearAllMocks())

    it('should return a submission hash when it has no attachments', async () => {
      const randomBytesSpy = jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => MOCK_SALT)
      const pbkdf2Spy = jest
        .spyOn(crypto, 'pbkdf2')
        .mockImplementation(
          (_basestring, _salt, _iters, _keylength, _type, cb) =>
            cb(null, MOCK_HASH),
        )
      const response = generateNewSingleAnswerResponse(BasicField.LongText)
      const responseAsEmailField = generateSingleAnswerFormData(response)
      const expectedBaseString = `${response.question} ${response.answer}; `

      const result = await EmailSubmissionService.hashSubmission(
        [responseAsEmailField],
        [],
      )

      expect(randomBytesSpy).toHaveBeenCalledWith(SALT_LENGTH)
      expect(pbkdf2Spy).toHaveBeenCalledWith(
        expectedBaseString,
        MOCK_SALT.toString('base64'),
        HASH_ITERATIONS,
        KEY_LENGTH,
        DIGEST_TYPE,
        expect.any(Function),
      )
      expect(result._unsafeUnwrap()).toEqual({
        hash: MOCK_HASH.toString('base64'),
        salt: MOCK_SALT.toString('base64'),
      })
    })

    it('should return a submission hash when it has one attachment', async () => {
      const randomBytesSpy = jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => MOCK_SALT)
      const pbkdf2Spy = jest
        .spyOn(crypto, 'pbkdf2')
        .mockImplementation(
          (_basestring, _salt, _iters, _keylength, _type, cb) =>
            cb(null, MOCK_HASH),
        )
      const response = generateNewAttachmentResponse()
      const responseAsEmailField = generateSingleAnswerFormData(
        response as unknown as ProcessedSingleAnswerResponse,
      )
      const expectedBaseString = `${response.question} ${response.answer}; ${response.content}`

      const result = await EmailSubmissionService.hashSubmission(
        [responseAsEmailField],
        [
          {
            fieldId: response._id,
            content: response.content,
            filename: response.answer,
          },
        ],
      )

      expect(randomBytesSpy).toHaveBeenCalledWith(SALT_LENGTH)
      expect(pbkdf2Spy).toHaveBeenCalledWith(
        expectedBaseString,
        MOCK_SALT.toString('base64'),
        HASH_ITERATIONS,
        KEY_LENGTH,
        DIGEST_TYPE,
        expect.any(Function),
      )
      expect(result._unsafeUnwrap()).toEqual({
        hash: MOCK_HASH.toString('base64'),
        salt: MOCK_SALT.toString('base64'),
      })
    })

    it('should return a submission hash when it has multiple attachments', async () => {
      const randomBytesSpy = jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => MOCK_SALT)
      const pbkdf2Spy = jest
        .spyOn(crypto, 'pbkdf2')
        .mockImplementation(
          (_basestring, _salt, _iters, _keylength, _type, cb) =>
            cb(null, MOCK_HASH),
        )
      const response1 = generateNewAttachmentResponse({
        question: 'question1',
        answer: 'answer1',
        content: Buffer.from('content1'),
      })
      const responseAsEmailField1 = generateSingleAnswerFormData(
        response1 as unknown as ProcessedSingleAnswerResponse,
      )

      const response2 = generateNewAttachmentResponse({
        question: 'question2',
        answer: 'answer2',
        content: Buffer.from('content2'),
      })
      const expectedBaseString = `${response1.question} ${response1.answer}; ${response2.question} ${response2.answer}; ${response1.content}${response2.content}`
      const responseAsEmailField2 = generateSingleAnswerFormData(
        response2 as unknown as ProcessedSingleAnswerResponse,
      )

      const result = await EmailSubmissionService.hashSubmission(
        [responseAsEmailField1, responseAsEmailField2],
        [
          {
            fieldId: response1._id,
            content: response1.content,
            filename: response1.answer,
          },
          {
            fieldId: response2._id,
            content: response2.content,
            filename: response2.answer,
          },
        ],
      )

      expect(randomBytesSpy).toHaveBeenCalledWith(SALT_LENGTH)
      expect(pbkdf2Spy).toHaveBeenCalledWith(
        expectedBaseString,
        MOCK_SALT.toString('base64'),
        HASH_ITERATIONS,
        KEY_LENGTH,
        DIGEST_TYPE,
        expect.any(Function),
      )
      expect(result._unsafeUnwrap()).toEqual({
        hash: MOCK_HASH.toString('base64'),
        salt: MOCK_SALT.toString('base64'),
      })
    })
  })

  describe('saveSubmissionMetadata', () => {
    const MYINFO_ATTRS = ['name', 'sex']
    const MOCK_EMAIL_FORM = {
      _id: new ObjectId(),
      title: 'title',
      authType: FormAuthType.SP,
      getUniqueMyInfoAttrs: () => MYINFO_ATTRS,
      emails: ['a@abc.com', 'b@cde.com'],
    } as IEmailFormSchema

    it('should create an email submission with the correct parameters', async () => {
      const mockSubmission = 'mockSubmission'
      const createEmailSubmissionSpy = jest
        .spyOn(EmailSubmissionModel, 'create')
        .mockResolvedValueOnce(
          mockSubmission as unknown as ResolvedValue<IEmailSubmissionSchema>,
        )
      const result = await EmailSubmissionService.saveSubmissionMetadata(
        MOCK_EMAIL_FORM as IPopulatedEmailForm,
        { hash: MOCK_HASH.toString(), salt: MOCK_SALT.toString() },
      )
      expect(createEmailSubmissionSpy).toHaveBeenCalledWith({
        form: MOCK_EMAIL_FORM._id,
        authType: MOCK_EMAIL_FORM.authType,
        myInfoFields: MYINFO_ATTRS,
        recipientEmails: MOCK_EMAIL_FORM.emails,
        responseHash: MOCK_HASH.toString(),
        responseSalt: MOCK_SALT.toString(),
        submissionType: SubmissionType.Email,
      })
      expect(result._unsafeUnwrap()).toEqual(mockSubmission)
    })

    it('should return DatabaseError when email submission creation fails', async () => {
      const createEmailSubmissionSpy = jest
        .spyOn(EmailSubmissionModel, 'create')
        .mockImplementationOnce(() => Promise.reject(new Error()))
      const result = await EmailSubmissionService.saveSubmissionMetadata(
        MOCK_EMAIL_FORM as IPopulatedEmailForm,
        { hash: MOCK_HASH.toString(), salt: MOCK_SALT.toString() },
      )
      expect(createEmailSubmissionSpy).toHaveBeenCalledWith({
        form: MOCK_EMAIL_FORM._id,
        authType: MOCK_EMAIL_FORM.authType,
        myInfoFields: MYINFO_ATTRS,
        recipientEmails: MOCK_EMAIL_FORM.emails,
        responseHash: MOCK_HASH.toString(),
        responseSalt: MOCK_SALT.toString(),
        submissionType: SubmissionType.Email,
      })
      expect(result._unsafeUnwrapErr()).toEqual(
        new DatabaseError('Error while saving submission to database'),
      )
    })
  })

  describe('extractEmailAnswers', () => {
    const MOCK_ANSWER_1 = 'mockAnswer1'
    const MOCK_ANSWER_2 = 'mockAnswer2'
    it('should include an email field with an answer when there is a single email field', () => {
      const result = EmailSubmissionService.extractEmailAnswers([
        {
          _id: new ObjectId().toHexString(),
          question: 'email',
          fieldType: BasicField.Email,
          answer: MOCK_ANSWER_1,
        },
      ])
      expect(result).toEqual([MOCK_ANSWER_1])
    })

    it('should include all email fields when all have answers', () => {
      const result = EmailSubmissionService.extractEmailAnswers([
        {
          _id: new ObjectId().toHexString(),
          question: 'email',
          fieldType: BasicField.Email,
          answer: MOCK_ANSWER_1,
        },
        {
          _id: new ObjectId().toHexString(),
          question: 'email2',
          fieldType: BasicField.Email,
          answer: MOCK_ANSWER_2,
        },
      ])
      expect(result).toEqual([MOCK_ANSWER_1, MOCK_ANSWER_2])
    })

    it('should include only the email fields with answers when some do not have answers', () => {
      const result = EmailSubmissionService.extractEmailAnswers([
        {
          _id: new ObjectId().toHexString(),
          question: 'email',
          fieldType: BasicField.Email,
          answer: MOCK_ANSWER_1,
        },
        {
          _id: new ObjectId().toHexString(),
          question: 'email2',
          fieldType: BasicField.Email,
          answer: '',
        },
      ])
      expect(result).toEqual([MOCK_ANSWER_1])
    })

    it('should include no fields when no email fields have answers', () => {
      const result = EmailSubmissionService.extractEmailAnswers([
        {
          _id: new ObjectId().toHexString(),
          question: 'email',
          fieldType: BasicField.Email,
          answer: '',
        },
        {
          _id: new ObjectId().toHexString(),
          question: 'email',
          fieldType: BasicField.Email,
          answer: '',
        },
      ])
      expect(result).toEqual([])
    })

    it('should not include non-email fields', () => {
      const result = EmailSubmissionService.extractEmailAnswers([
        {
          _id: new ObjectId().toHexString(),
          question: 'number',
          fieldType: BasicField.Number,
          answer: MOCK_ANSWER_1,
        },
        {
          _id: new ObjectId().toHexString(),
          question: 'email',
          fieldType: BasicField.Email,
          answer: MOCK_ANSWER_1,
        },
      ])
      expect(result).toEqual([MOCK_ANSWER_1])
    })
  })
})
