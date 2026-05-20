import { FieldResponsesV4 } from '@opengovsg/formsg-sdk'

import type { FormFieldDto } from 'formsg-shared/types'
import { BasicField } from 'formsg-shared/types'

import { augmentDecryptedResponsesV4 } from './augmentDecryptedResponses'

const makeFormField = (
  id: string,
  fieldType: BasicField,
  title = `Question ${id}`,
): FormFieldDto =>
  ({
    _id: id,
    fieldType,
    title,
  }) as unknown as FormFieldDto

const makeResponse = (
  fieldType: string,
  question: string,
  answerValue = 'some answer',
): FieldResponsesV4[string] => ({
  fieldType: fieldType as never,
  question,
  answer: { value: answerValue } as never,
  provenance: {},
})

describe('augmentDecryptedResponsesV4', () => {
  describe('Section (header) fields', () => {
    it('includes a Section field with unanswered=true and no questionNumber', () => {
      const formFields = [
        makeFormField('sec-1', BasicField.Section, 'About You'),
      ]
      const responses: FieldResponsesV4 = {}

      const result = augmentDecryptedResponsesV4(formFields, responses, {})

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        fieldId: 'sec-1',
        unanswered: true,
      })
      expect(result[0].field.question).toBe('About You')
      expect(result[0].field.fieldType).toBe(BasicField.Section)
    })

    it('assigns a synthetic field using the form field title for a Section', () => {
      const formFields = [
        makeFormField('sec-2', BasicField.Section, 'Work History'),
      ]
      const result = augmentDecryptedResponsesV4(formFields, {}, {})

      expect(result[0].field.question).toBe('Work History')
    })
  })

  describe('Non-response fields excluded from output', () => {
    it('excludes Statement fields', () => {
      const formFields = [makeFormField('stmt-1', BasicField.Statement)]
      const result = augmentDecryptedResponsesV4(formFields, {}, {})

      expect(result).toHaveLength(0)
    })

    it('excludes Image fields', () => {
      const formFields = [makeFormField('img-1', BasicField.Image)]
      const result = augmentDecryptedResponsesV4(formFields, {}, {})

      expect(result).toHaveLength(0)
    })
  })

  describe('Question numbering', () => {
    it('assigns correct questionNumber to response fields, skipping non-response fields', () => {
      const formFields = [
        makeFormField('sec-1', BasicField.Section),
        makeFormField('q-1', BasicField.ShortText),
        makeFormField('stmt-1', BasicField.Statement),
        makeFormField('q-2', BasicField.Email),
      ]
      const responses: FieldResponsesV4 = {
        'q-1': makeResponse('textfield', 'Name'),
        'q-2': makeResponse('email', 'Email'),
      }

      const result = augmentDecryptedResponsesV4(formFields, responses, {})

      const answeredFields = result.filter((r) => !r.unanswered)
      expect(answeredFields[0].questionNumber).toBe(1) // index 1, minus 1 non-response before it
      expect(answeredFields[1].questionNumber).toBe(2) // index 3, minus 1 section + 1 statement = 2 non-response fields → but statement is excluded so only section counts
    })

    it('numbers multiple response fields consecutively after a section header', () => {
      const formFields = [
        makeFormField('sec-1', BasicField.Section),
        makeFormField('q-1', BasicField.ShortText),
        makeFormField('q-2', BasicField.ShortText),
      ]
      const responses: FieldResponsesV4 = {
        'q-1': makeResponse('textfield', 'First name'),
        'q-2': makeResponse('textfield', 'Last name'),
      }

      const result = augmentDecryptedResponsesV4(formFields, responses, {})

      const answered = result.filter((r) => !r.unanswered)
      expect(answered[0].questionNumber).toBe(1)
      expect(answered[1].questionNumber).toBe(2)
    })
  })

  describe('Unanswered optional fields', () => {
    it('marks fields missing from responses as unanswered=true', () => {
      const formFields = [
        makeFormField('q-1', BasicField.ShortText, 'Nickname'),
      ]
      const result = augmentDecryptedResponsesV4(formFields, {}, {})

      expect(result).toHaveLength(1)
      expect(result[0].unanswered).toBe(true)
      expect(result[0].questionNumber).toBe(1)
    })

    it('uses form field title as question text for unanswered fields', () => {
      const formFields = [makeFormField('q-2', BasicField.Email, 'Your email')]
      const result = augmentDecryptedResponsesV4(formFields, {}, {})

      expect(result[0].field.question).toBe('Your email')
    })

    it('marks answered fields as unanswered=false', () => {
      const formFields = [makeFormField('q-3', BasicField.ShortText, 'City')]
      const responses: FieldResponsesV4 = {
        'q-3': makeResponse('textfield', 'City', 'Singapore'),
      }

      const result = augmentDecryptedResponsesV4(formFields, responses, {})

      expect(result[0].unanswered).toBe(false)
    })
  })

  describe('Attachment download URLs', () => {
    it('sets downloadUrl for attachment fields when metadata is present', () => {
      const formFields = [
        makeFormField('att-1', BasicField.Attachment, 'Upload file'),
      ]
      const responses: FieldResponsesV4 = {
        'att-1': makeResponse('attachment', 'Upload file', 'file.pdf'),
      }
      const attachmentMetadata = { 'att-1': 'https://example.com/file.pdf' }

      const result = augmentDecryptedResponsesV4(
        formFields,
        responses,
        attachmentMetadata,
      )

      expect(result[0].downloadUrl).toBe('https://example.com/file.pdf')
    })

    it('leaves downloadUrl undefined when no attachment metadata exists', () => {
      const formFields = [makeFormField('q-1', BasicField.ShortText, 'Name')]
      const responses: FieldResponsesV4 = {
        'q-1': makeResponse('textfield', 'Name', 'Alice'),
      }

      const result = augmentDecryptedResponsesV4(formFields, responses, {})

      expect(result[0].downloadUrl).toBeUndefined()
    })
  })

  describe('Mixed form with sections, unanswered, and answered fields', () => {
    it('produces the correct ordered list of augmented responses', () => {
      const formFields = [
        makeFormField('sec-1', BasicField.Section, 'Section A'),
        makeFormField('q-1', BasicField.ShortText, 'Name'),
        makeFormField('q-2', BasicField.Email, 'Email'),
        makeFormField('stmt-1', BasicField.Statement, 'Please note'),
        makeFormField('sec-2', BasicField.Section, 'Section B'),
        makeFormField('q-3', BasicField.ShortText, 'City'),
      ]
      const responses: FieldResponsesV4 = {
        'q-1': makeResponse('textfield', 'Name', 'Alice'),
        // q-2 not answered (unanswered)
        'q-3': makeResponse('textfield', 'City', 'Singapore'),
      }

      const result = augmentDecryptedResponsesV4(formFields, responses, {})

      // Statement is excluded; Sections are included as unanswered
      // Expected output: [sec-1, q-1, q-2, sec-2, q-3]
      expect(result.map((r) => r.fieldId)).toEqual([
        'sec-1',
        'q-1',
        'q-2',
        'sec-2',
        'q-3',
      ])

      expect(result[0]).toMatchObject({ unanswered: true }) // sec-1
      expect(result[1]).toMatchObject({ unanswered: false, questionNumber: 1 }) // q-1 (index 1, 1 non-response before)
      expect(result[2]).toMatchObject({ unanswered: true, questionNumber: 2 }) // q-2 unanswered
      expect(result[3]).toMatchObject({ unanswered: true }) // sec-2
      expect(result[4]).toMatchObject({ unanswered: false, questionNumber: 3 }) // q-3 (index 3, 2 non-response: sec-1 + stmt-1 + sec-2 = 3, but stmt-1 increments count without being in results)
    })
  })
})
