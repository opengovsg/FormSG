import { ObjectId } from 'bson'
import { BasicField } from 'formsg-shared/types'

import * as EmailSubmissionService from '../email-submission.service'

describe('email-submission.service', () => {
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
