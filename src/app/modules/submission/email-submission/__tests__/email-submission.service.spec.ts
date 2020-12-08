import { ObjectId } from 'bson'
import crypto from 'crypto'
import { readFileSync } from 'fs'
import { omit } from 'lodash'
import mongoose from 'mongoose'
import { mocked } from 'ts-jest/utils'

import { getEmailSubmissionModel } from 'src/app/models/submission.server.model'
import { DatabaseError } from 'src/app/modules/core/core.errors'
import config from 'src/config/config'
import { types as basicTypes } from 'src/shared/resources/basic'
import {
  AuthType,
  BasicField,
  IEmailFormSchema,
  IEmailSubmissionSchema,
  MyInfoAttribute,
  SubmissionType,
} from 'src/types'

import {
  generateSingleAnswerAutoreply,
  generateSingleAnswerFormData,
  generateSingleAnswerJson,
} from 'tests/unit/backend/helpers/generate-email-data'
import {
  generateNewAttachmentResponse,
  generateNewCheckboxResponse,
  generateNewSingleAnswerResponse,
  generateNewTableResponse,
} from 'tests/unit/backend/helpers/generate-form-data'

import {
  ATTACHMENT_PREFIX,
  DIGEST_TYPE,
  HASH_ITERATIONS,
  KEY_LENGTH,
  MYINFO_PREFIX,
  SALT_LENGTH,
  TABLE_PREFIX,
  VERIFIED_PREFIX,
} from '../email-submission.constants'
import {
  AttachmentTooLargeError,
  InvalidFileExtensionError,
} from '../email-submission.errors'
import * as EmailSubmissionService from '../email-submission.service'

jest.mock('src/config/config')
const MOCK_SALT = Buffer.from('salt')
const MOCK_HASH = Buffer.from('mockHash')

const EmailSubmissionModel = getEmailSubmissionModel(mongoose)

const ALL_SINGLE_SUBMITTED_RESPONSES = basicTypes
  // Attachments are special cases, requiring filename and content
  // Section fields are not submitted
  .filter(
    (t) =>
      !t.answerArray &&
      ![BasicField.Attachment, BasicField.Section].includes(t.name),
  )
  .map((t) => generateNewSingleAnswerResponse(t.name))

describe('email-submission.service', () => {
  describe('createEmailData', () => {
    it('should return email data correctly for all single answer field types', () => {
      const emailData = EmailSubmissionService.createEmailData(
        ALL_SINGLE_SUBMITTED_RESPONSES,
        new Set(),
      )
      const expectedAutoReplyData = ALL_SINGLE_SUBMITTED_RESPONSES.map(
        generateSingleAnswerAutoreply,
      )
      const expectedJsonData = ALL_SINGLE_SUBMITTED_RESPONSES.map(
        generateSingleAnswerJson,
      )
      const expectedFormData = ALL_SINGLE_SUBMITTED_RESPONSES.map(
        generateSingleAnswerFormData,
      )
      expect(emailData.autoReplyData).toEqual(expectedAutoReplyData)
      expect(emailData.jsonData).toEqual(expectedJsonData)
      expect(emailData.formData).toEqual(expectedFormData)
    })

    it('should exclude section fields from JSON data', () => {
      const response = generateNewSingleAnswerResponse(BasicField.Section)

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      expect(emailData).toEqual({
        jsonData: [],
        autoReplyData: [generateSingleAnswerAutoreply(response)],
        formData: [generateSingleAnswerFormData(response)],
      })
    })

    it('should exclude non-visible fields from autoreply data', () => {
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        isVisible: false,
      })

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      expect(emailData).toEqual({
        jsonData: [generateSingleAnswerJson(response)],
        autoReplyData: [],
        formData: [generateSingleAnswerFormData(response)],
      })
    })

    it('should generate table answers with [table] prefix in form and JSON data', () => {
      const response = generateNewTableResponse()

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      const question = response.question
      const firstRow = response.answerArray[0].join(',')
      const secondRow = response.answerArray[1].join(',')

      expect(emailData).toEqual({
        jsonData: [
          { question: `${TABLE_PREFIX}${question}`, answer: firstRow },
          { question: `${TABLE_PREFIX}${question}`, answer: secondRow },
        ],
        autoReplyData: [
          { question, answerTemplate: [firstRow] },
          { question, answerTemplate: [secondRow] },
        ],
        formData: [
          {
            question: `${TABLE_PREFIX}${question}`,
            answer: firstRow,
            answerTemplate: [firstRow],
            fieldType: BasicField.Table,
          },
          {
            question: `${TABLE_PREFIX}${question}`,
            answer: secondRow,
            answerTemplate: [secondRow],
            fieldType: BasicField.Table,
          },
        ],
      })
    })

    it('should generate checkbox answers correctly', () => {
      const response = generateNewCheckboxResponse()

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      const question = response.question
      const answer = response.answerArray.join(', ')

      expect(emailData).toEqual({
        jsonData: [{ question, answer }],
        autoReplyData: [{ question, answerTemplate: [answer] }],
        formData: [
          {
            question,
            answer,
            answerTemplate: [answer],
            fieldType: BasicField.Checkbox,
          },
        ],
      })
    })

    it('should generate attachment answers with [attachment] prefix in form and JSON data', () => {
      const response = generateNewAttachmentResponse()

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      const question = response.question
      const answer = response.answer

      expect(emailData).toEqual({
        jsonData: [{ question: `${ATTACHMENT_PREFIX}${question}`, answer }],
        autoReplyData: [{ question, answerTemplate: [answer] }],
        formData: [
          {
            question: `${ATTACHMENT_PREFIX}${question}`,
            answer,
            answerTemplate: [answer],
            fieldType: BasicField.Attachment,
          },
        ],
      })
    })

    it('should split single answer fields by newline', () => {
      const answer = 'first line\nsecond line'
      const response = generateNewSingleAnswerResponse(BasicField.ShortText, {
        answer,
      })

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      const question = response.question

      expect(emailData).toEqual({
        jsonData: [{ question, answer }],
        autoReplyData: [{ question, answerTemplate: answer.split('\n') }],
        formData: [
          {
            question,
            answer,
            answerTemplate: answer.split('\n'),
            fieldType: BasicField.ShortText,
          },
        ],
      })
    })

    it('should split table answers by newline', () => {
      const answerArray = [['firstLine\nsecondLine', 'thirdLine\nfourthLine']]
      const response = generateNewTableResponse({ answerArray })

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      const question = response.question
      const answer = answerArray[0].join(',')

      expect(emailData).toEqual({
        jsonData: [{ question: `${TABLE_PREFIX}${question}`, answer }],
        autoReplyData: [{ question, answerTemplate: answer.split('\n') }],
        formData: [
          {
            question: `${TABLE_PREFIX}${question}`,
            answer,
            answerTemplate: answer.split('\n'),
            fieldType: BasicField.Table,
          },
        ],
      })
    })

    it('should split checkbox answers by newline', () => {
      const answerArray = ['firstLine\nsecondLine', 'thirdLine\nfourtLine']
      const response = generateNewCheckboxResponse({ answerArray })

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      const question = response.question
      const answer = answerArray.join(', ')

      expect(emailData).toEqual({
        jsonData: [{ question, answer }],
        autoReplyData: [{ question, answerTemplate: answer.split('\n') }],
        formData: [
          {
            question,
            answer,
            answerTemplate: answer.split('\n'),
            fieldType: BasicField.Checkbox,
          },
        ],
      })
    })

    it('should prefix verified fields with [verified] only in form data', () => {
      const response = generateNewSingleAnswerResponse(BasicField.Email, {
        isUserVerified: true,
      })

      const emailData = EmailSubmissionService.createEmailData(
        [response],
        new Set(),
      )

      const question = response.question
      const answer = response.answer

      expect(emailData).toEqual({
        jsonData: [{ question, answer }],
        autoReplyData: [{ question, answerTemplate: [answer] }],
        formData: [
          {
            question: `${VERIFIED_PREFIX}${question}`,
            answer,
            answerTemplate: [answer],
            fieldType: BasicField.Email,
          },
        ],
      })
    })

    it('should prefix MyInfo-verified fields with [MyInfo] only in form data', () => {
      // MyInfo-verified
      const nameResponse = generateNewSingleAnswerResponse(
        BasicField.ShortText,
        {
          myInfo: { attr: MyInfoAttribute.Name },
          answer: 'name',
        },
      )

      // MyInfo field but not MyInfo-verified
      const vehicleResponse = generateNewSingleAnswerResponse(
        BasicField.ShortText,
        {
          myInfo: { attr: MyInfoAttribute.VehicleNo },
          answer: 'vehiclenumber',
        },
      )

      const emailData = EmailSubmissionService.createEmailData(
        [nameResponse, vehicleResponse],
        new Set([nameResponse._id]),
      )

      expect(emailData).toEqual({
        jsonData: [
          { question: nameResponse.question, answer: nameResponse.answer },
          {
            question: vehicleResponse.question,
            answer: vehicleResponse.answer,
          },
        ],
        autoReplyData: [
          {
            question: nameResponse.question,
            answerTemplate: [nameResponse.answer],
          },
          {
            question: vehicleResponse.question,
            answerTemplate: [vehicleResponse.answer],
          },
        ],
        formData: [
          {
            // Prefixed because its ID was in the Set
            question: `${MYINFO_PREFIX}${nameResponse.question}`,
            answer: nameResponse.answer,
            answerTemplate: [nameResponse.answer],
            fieldType: BasicField.ShortText,
          },
          {
            // Not prefixed because ID not in Set
            question: vehicleResponse.question,
            answer: vehicleResponse.answer,
            answerTemplate: [vehicleResponse.answer],
            fieldType: BasicField.ShortText,
          },
        ],
      })
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
        content: readFileSync('./tests/unit/backend/resources/invalid.py'),
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
          './tests/unit/backend/resources/nestedInvalid.zip',
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
        content: readFileSync('./tests/unit/backend/resources/govtech.jpg'),
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
        content: readFileSync('./tests/unit/backend/resources/nestedValid.zip'),
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
    const randomBytesSpy = jest
      .spyOn(crypto, 'randomBytes')
      .mockImplementation(() => MOCK_SALT)
    const pbkdf2Spy = jest
      .spyOn(crypto, 'pbkdf2')
      .mockImplementation((_basestring, _salt, _iters, _keylength, _type, cb) =>
        cb(null, MOCK_HASH),
      )

    it('should return a submission hash when it has no attachments', async () => {
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
      const response = generateNewAttachmentResponse()
      const responseAsEmailField = generateSingleAnswerFormData(response)
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
      const response1 = generateNewAttachmentResponse({
        question: 'question1',
        answer: 'answer1',
        content: Buffer.from('content1'),
      })
      const responseAsEmailField1 = generateSingleAnswerFormData(response1)

      const response2 = generateNewAttachmentResponse({
        question: 'question2',
        answer: 'answer2',
        content: Buffer.from('content2'),
      })
      const expectedBaseString = `${response1.question} ${response1.answer}; ${response2.question} ${response2.answer}; ${response1.content}${response2.content}`
      const responseAsEmailField2 = generateSingleAnswerFormData(response2)

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
      authType: AuthType.SP,
      getUniqueMyInfoAttrs: () => MYINFO_ATTRS,
      emails: ['a@abc.com', 'b@cde.com'],
    } as IEmailFormSchema
    const createEmailSubmissionSpy = jest.spyOn(EmailSubmissionModel, 'create')

    it('should create an email submission with the correct parameters', async () => {
      const mockSubmission = 'mockSubmission'
      createEmailSubmissionSpy.mockResolvedValueOnce(
        (mockSubmission as unknown) as IEmailSubmissionSchema,
      )
      const result = await EmailSubmissionService.saveSubmissionMetadata(
        MOCK_EMAIL_FORM,
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
      createEmailSubmissionSpy.mockImplementationOnce(() =>
        Promise.reject(new Error()),
      )
      const result = await EmailSubmissionService.saveSubmissionMetadata(
        MOCK_EMAIL_FORM,
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
})
