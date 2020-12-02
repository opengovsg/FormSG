import { readFileSync } from 'fs'
import { omit } from 'lodash'

import { types as basicTypes } from 'src/shared/resources/basic'
import { BasicField, MyInfoAttribute } from 'src/types'

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
  MYINFO_PREFIX,
  TABLE_PREFIX,
  VERIFIED_PREFIX,
} from '../email-submission.constants'
import {
  AttachmentTooLargeError,
  InvalidFileExtensionError,
} from '../email-submission.errors'
import * as EmailSubmissionService from '../email-submission.service'

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
})
