import {
  generateAttachmentResponseV3,
  generateCheckboxResponseV3,
  generateRadioResponseV3,
  generateTableResponseV3,
  generateVerifiableAnswerResponseV3,
  generateYesNoAnswerResponseV3,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { CLIENT_CHECKBOX_OTHERS_INPUT_VALUE } from 'shared/constants'
import { BasicField } from 'shared/types'

import { checkIsResponseChangedV3 } from '../field-validation.utils'

describe('checkIsResponseChangedV3', () => {
  describe('yes/no field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateYesNoAnswerResponseV3('Yes')
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: { ...response },
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateYesNoAnswerResponseV3('Yes')
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: undefined,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response has changed', () => {
      const response = generateYesNoAnswerResponseV3('Yes')
      const prevResponse = generateYesNoAnswerResponseV3('No')
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })
  })

  describe('mobile field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6598765432',
          signature: 'some signature',
        },
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: { ...response },
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6598765432',
          signature: 'some signature',
        },
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: undefined,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response value has changed', () => {
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6598765432',
          signature: 'some signature',
        },
      })
      const prevResponse = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6587654321',
          signature: 'some signature',
        },
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response signature has changed', () => {
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6598765432',
          signature: 'new signature',
        },
      })
      const prevResponse = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Mobile,
        answer: {
          value: '+6598765432',
          signature: 'old signature',
        },
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })
  })

  describe('email field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'some signature',
        },
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: { ...response },
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'some signature',
        },
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: undefined,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response value has changed', () => {
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'some signature',
        },
      })
      const prevResponse = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'different@email.com',
          signature: 'some signature',
        },
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response signature has changed', () => {
      const response = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'new signature',
        },
      })
      const prevResponse = generateVerifiableAnswerResponseV3({
        fieldType: BasicField.Email,
        answer: {
          value: 'valid@email.com',
          signature: 'old signature',
        },
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })
  })

  describe('radio field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateRadioResponseV3({
        value: 'a',
      })
      const prevResponse = generateRadioResponseV3({
        value: 'a',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns false if previous response changes to othersInput but the string is equal', () => {
      const response = generateRadioResponseV3({
        value: 'a',
      })
      const prevResponse = generateRadioResponseV3({
        othersInput: 'a',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateRadioResponseV3({
        value: 'a',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: undefined,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response value has changed', () => {
      const response = generateRadioResponseV3({
        value: 'a',
      })
      const prevResponse = generateRadioResponseV3({
        value: 'b',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response value changes from othersInput to value and the string is not equal', () => {
      const response = generateRadioResponseV3({
        value: 'new input',
      })
      const prevResponse = generateRadioResponseV3({
        othersInput: 'old input',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response value changes from value to othersInput and the string is not equal', () => {
      const response = generateRadioResponseV3({
        othersInput: 'new input',
      })
      const prevResponse = generateRadioResponseV3({
        value: 'old input',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response othersInput has changed', () => {
      const response = generateRadioResponseV3({
        othersInput: 'new input',
      })
      const prevResponse = generateRadioResponseV3({
        othersInput: 'old input',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })
  })

  describe('checkbox field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateCheckboxResponseV3({
        value: ['a', 'b'],
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: { ...response },
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns false when othersInput value is changed but not selected for current and previous responses', () => {
      const response = generateCheckboxResponseV3({
        value: ['a'],
      })
      const prevResponse = generateCheckboxResponseV3({
        value: ['a'],
        othersInput: 'old input',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns true if the othersInput value is different', () => {
      const response = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'new input',
      })
      const prevResponse = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'old input',
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true when new othersInput is added', () => {
      const response = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
        othersInput: 'new input',
      })
      const prevResponse = generateCheckboxResponseV3({
        value: ['a'],
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true when othersInput is removed', () => {
      const response = generateCheckboxResponseV3({
        value: ['a'],
      })
      const prevResponse = generateCheckboxResponseV3({
        value: ['a', CLIENT_CHECKBOX_OTHERS_INPUT_VALUE],
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if no previous response is present', () => {
      const response = generateCheckboxResponseV3({
        value: ['a', 'b'],
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: undefined,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response has changed', () => {
      const response = generateCheckboxResponseV3({
        value: ['a', 'b'],
      })
      const prevResponse = generateCheckboxResponseV3({
        value: ['b', 'c'],
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })
  })

  describe('table field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateTableResponseV3([
        {
          '000000000000000000000001': 'hello',
          '000000000000000000000002': 'world',
        },
      ])
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: { ...response },
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateTableResponseV3([
        {
          '000000000000000000000001': 'hello',
          '000000000000000000000002': 'world',
        },
      ])
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: undefined,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response row content has changed', () => {
      const response = generateTableResponseV3([
        {
          '000000000000000000000001': 'hello',
          '000000000000000000000002': 'new world',
        },
      ])
      const prevResponse = generateTableResponseV3([
        {
          '000000000000000000000001': 'hello',
          '000000000000000000000002': 'old world',
        },
      ])
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if number of rows has changed', () => {
      const response = generateTableResponseV3([
        {
          '000000000000000000000001': 'hello',
          '000000000000000000000002': 'world',
        },
        {
          '000000000000000000000001': 'hello2',
          '000000000000000000000002': 'world2',
        },
      ])
      const prevResponse = generateTableResponseV3([
        {
          '000000000000000000000001': 'hello',
          '000000000000000000000002': 'world',
        },
      ])
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })
  })

  describe('attachment field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateAttachmentResponseV3({
        content: Buffer.from('test content'),
        answer: 'test answer',
        filename: 'test.txt',
        hasBeenScanned: false,
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: { ...response },
      })
      expect(checkIsResponseChangedV3Result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateAttachmentResponseV3({
        content: Buffer.from('test content'),
        answer: 'test answer',
        filename: 'test.txt',
        hasBeenScanned: false,
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse: undefined,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response content has changed', () => {
      const response = generateAttachmentResponseV3({
        content: Buffer.from('new content'),
        answer: 'test answer',
        filename: 'test.txt',
        hasBeenScanned: false,
      })
      const prevResponse = generateAttachmentResponseV3({
        content: Buffer.from('old content'),
        answer: 'test answer',
        filename: 'test.txt',
        hasBeenScanned: false,
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response answer has changed', () => {
      const response = generateAttachmentResponseV3({
        content: Buffer.from('test content'),
        answer: 'new answer',
        filename: 'test.txt',
        hasBeenScanned: false,
      })
      const prevResponse = generateAttachmentResponseV3({
        content: Buffer.from('test content'),
        answer: 'old answer',
        filename: 'test.txt',
        hasBeenScanned: false,
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })

    it('returns true if response filename has changed', () => {
      const response = generateAttachmentResponseV3({
        content: Buffer.from('test content'),
        answer: 'test answer',
        filename: 'new.txt',
        hasBeenScanned: false,
      })
      const prevResponse = generateAttachmentResponseV3({
        content: Buffer.from('test content'),
        answer: 'test answer',
        filename: 'old.txt',
        hasBeenScanned: false,
      })
      const checkIsResponseChangedV3Result = checkIsResponseChangedV3({
        response,
        prevResponse,
      })
      expect(checkIsResponseChangedV3Result).toBe(true)
    })
  })
})
