import type { FormField } from '@opengovsg/formsg-sdk/dist/types'

import { BasicField } from 'formsg-shared/types'

import { augmentDecryptedResponses } from './augmentDecryptedResponses'

const makeFormField = (
  id: string,
  fieldType: BasicField,
  question = `Question ${id}`,
): FormField =>
  ({
    _id: id,
    fieldType,
    question,
    answer: '',
  }) as unknown as FormField

describe('augmentDecryptedResponses', () => {
  describe('Section (header) fields', () => {
    it('includes a Section field with no questionNumber', () => {
      const formFields = [
        makeFormField('sec-1', BasicField.Section, 'About You'),
      ]

      const result = augmentDecryptedResponses(formFields, {})

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        _id: 'sec-1',
        question: 'About You',
        fieldType: BasicField.Section,
      })
      expect(result[0].questionNumber).toBeUndefined()
    })
  })

  describe('Non-response fields included without questionNumber', () => {
    it('includes Statement fields without questionNumber', () => {
      const formFields = [makeFormField('stmt-1', BasicField.Statement)]
      const result = augmentDecryptedResponses(formFields, {})

      expect(result).toHaveLength(1)
      expect(result[0].questionNumber).toBeUndefined()
    })

    it('includes Image fields without questionNumber', () => {
      const formFields = [makeFormField('img-1', BasicField.Image)]
      const result = augmentDecryptedResponses(formFields, {})

      expect(result).toHaveLength(1)
      expect(result[0].questionNumber).toBeUndefined()
    })
  })

  describe('Question numbering', () => {
    it('assigns correct questionNumber to response fields, skipping non-response fields', () => {
      const formFields = [
        makeFormField('sec-1', BasicField.Section),
        makeFormField('q-1', BasicField.ShortText, 'Name'),
        makeFormField('stmt-1', BasicField.Statement),
        makeFormField('q-2', BasicField.Email, 'Email'),
      ]

      const result = augmentDecryptedResponses(formFields, {})

      const responseFields = result.filter(
        (r) => r.questionNumber !== undefined,
      )
      expect(responseFields[0].questionNumber).toBe(1) // index 1, minus 1 non-response (sec-1)
      expect(responseFields[1].questionNumber).toBe(2) // index 3, minus 2 non-response (sec-1 + stmt-1)
    })

    it('numbers multiple response fields consecutively after a section header', () => {
      const formFields = [
        makeFormField('sec-1', BasicField.Section),
        makeFormField('q-1', BasicField.ShortText, 'First name'),
        makeFormField('q-2', BasicField.ShortText, 'Last name'),
      ]

      const result = augmentDecryptedResponses(formFields, {})

      const responseFields = result.filter(
        (r) => r.questionNumber !== undefined,
      )
      expect(responseFields[0].questionNumber).toBe(1)
      expect(responseFields[1].questionNumber).toBe(2)
    })
  })

  describe('Attachment download URLs', () => {
    it('sets downloadUrl for attachment fields when metadata is present', () => {
      const formFields = [
        makeFormField('att-1', BasicField.Attachment, 'Upload file'),
      ]
      const attachmentMetadata = { 'att-1': 'https://example.com/file.pdf' }

      const result = augmentDecryptedResponses(formFields, attachmentMetadata)

      expect(result[0].downloadUrl).toBe('https://example.com/file.pdf')
    })

    it('leaves downloadUrl undefined when no attachment metadata exists', () => {
      const formFields = [makeFormField('q-1', BasicField.ShortText, 'Name')]

      const result = augmentDecryptedResponses(formFields, {})

      expect(result[0].downloadUrl).toBeUndefined()
    })
  })

  describe('Mixed form with sections, statements, and response fields', () => {
    it('produces the correct ordered list of augmented responses', () => {
      const formFields = [
        makeFormField('sec-1', BasicField.Section, 'Section A'),
        makeFormField('q-1', BasicField.ShortText, 'Name'),
        makeFormField('q-2', BasicField.Email, 'Email'),
        makeFormField('stmt-1', BasicField.Statement, 'Please note'),
        makeFormField('sec-2', BasicField.Section, 'Section B'),
        makeFormField('q-3', BasicField.ShortText, 'City'),
      ]

      const result = augmentDecryptedResponses(formFields, {})

      // All fields are included in order
      expect(result.map((r) => r._id)).toEqual([
        'sec-1',
        'q-1',
        'q-2',
        'stmt-1',
        'sec-2',
        'q-3',
      ])

      expect(result[0].questionNumber).toBeUndefined() // sec-1 (non-response)
      expect(result[1].questionNumber).toBe(1) // q-1 (index 1, 1 non-response before)
      expect(result[2].questionNumber).toBe(2) // q-2 (index 2, 1 non-response before)
      expect(result[3].questionNumber).toBeUndefined() // stmt-1 (non-response)
      expect(result[4].questionNumber).toBeUndefined() // sec-2 (non-response)
      expect(result[5].questionNumber).toBe(3) // q-3 (index 5, 3 non-response before)
    })
  })
})
