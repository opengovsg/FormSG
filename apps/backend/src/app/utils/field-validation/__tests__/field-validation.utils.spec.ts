import { BasicField } from 'formsg-shared/types'

import { ParsedClearFormFieldResponseV4 } from 'src/types/api/submission'

import { checkIsResponseChangedV4 } from '../field-validation.utils'

const generateResponseV4 = (
  fieldType: BasicField,
  answer: unknown,
): ParsedClearFormFieldResponseV4 =>
  ({
    fieldType,
    question: 'question',
    answer,
    provenance: {},
  }) as ParsedClearFormFieldResponseV4

describe('checkIsResponseChangedV4', () => {
  describe('generic string field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateResponseV4(BasicField.ShortText, {
        value: 'hello',
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: { ...response },
      })
      expect(result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateResponseV4(BasicField.ShortText, {
        value: 'hello',
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: undefined,
      })
      expect(result).toBe(true)
    })

    it('returns true if response has changed', () => {
      const response = generateResponseV4(BasicField.ShortText, {
        value: 'new value',
      })
      const prevResponse = generateResponseV4(BasicField.ShortText, {
        value: 'old value',
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })
  })

  it('returns true if field type has changed', () => {
    const response = generateResponseV4(BasicField.ShortText, {
      value: 'hello',
    })
    const prevResponse = generateResponseV4(BasicField.LongText, {
      value: 'hello',
    })
    const result = checkIsResponseChangedV4({ response, prevResponse })
    expect(result).toBe(true)
  })

  describe('yes/no field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateResponseV4(BasicField.YesNo, { value: 'Yes' })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: { ...response },
      })
      expect(result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateResponseV4(BasicField.YesNo, { value: 'Yes' })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: undefined,
      })
      expect(result).toBe(true)
    })

    it('returns true if response has changed', () => {
      const response = generateResponseV4(BasicField.YesNo, { value: 'Yes' })
      const prevResponse = generateResponseV4(BasicField.YesNo, {
        value: 'No',
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })
  })

  describe('mobile field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateResponseV4(BasicField.Mobile, {
        value: '+6598765432',
        signature: 'some signature',
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: { ...response },
      })
      expect(result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateResponseV4(BasicField.Mobile, {
        value: '+6598765432',
        signature: 'some signature',
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: undefined,
      })
      expect(result).toBe(true)
    })

    it('returns true if response value has changed', () => {
      const response = generateResponseV4(BasicField.Mobile, {
        value: '+6598765432',
        signature: 'some signature',
      })
      const prevResponse = generateResponseV4(BasicField.Mobile, {
        value: '+6587654321',
        signature: 'some signature',
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true if response signature has changed', () => {
      const response = generateResponseV4(BasicField.Mobile, {
        value: '+6598765432',
        signature: 'new signature',
      })
      const prevResponse = generateResponseV4(BasicField.Mobile, {
        value: '+6598765432',
        signature: 'old signature',
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })
  })

  describe('email field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateResponseV4(BasicField.Email, {
        value: 'valid@email.com',
        signature: 'some signature',
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: { ...response },
      })
      expect(result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateResponseV4(BasicField.Email, {
        value: 'valid@email.com',
        signature: 'some signature',
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: undefined,
      })
      expect(result).toBe(true)
    })

    it('returns true if response value has changed', () => {
      const response = generateResponseV4(BasicField.Email, {
        value: 'valid@email.com',
        signature: 'some signature',
      })
      const prevResponse = generateResponseV4(BasicField.Email, {
        value: 'different@email.com',
        signature: 'some signature',
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true if response signature has changed', () => {
      const response = generateResponseV4(BasicField.Email, {
        value: 'valid@email.com',
        signature: 'new signature',
      })
      const prevResponse = generateResponseV4(BasicField.Email, {
        value: 'valid@email.com',
        signature: 'old signature',
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })
  })

  describe('radio field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateResponseV4(BasicField.Radio, {
        value: 'a',
        isOthersInput: false,
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: { ...response },
      })
      expect(result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateResponseV4(BasicField.Radio, {
        value: 'a',
        isOthersInput: false,
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: undefined,
      })
      expect(result).toBe(true)
    })

    it('returns true if response value has changed', () => {
      const response = generateResponseV4(BasicField.Radio, {
        value: 'a',
        isOthersInput: false,
      })
      const prevResponse = generateResponseV4(BasicField.Radio, {
        value: 'b',
        isOthersInput: false,
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true if isOthersInput has changed even if value is equal', () => {
      const response = generateResponseV4(BasicField.Radio, {
        value: 'a',
        isOthersInput: true,
      })
      const prevResponse = generateResponseV4(BasicField.Radio, {
        value: 'a',
        isOthersInput: false,
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true if othersInput value has changed', () => {
      const response = generateResponseV4(BasicField.Radio, {
        value: 'new input',
        isOthersInput: true,
      })
      const prevResponse = generateResponseV4(BasicField.Radio, {
        value: 'old input',
        isOthersInput: true,
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })
  })

  describe('checkbox field type', () => {
    it('returns false if previous response is present but has not changed', () => {
      const response = generateResponseV4(BasicField.Checkbox, {
        value: ['a', 'b'],
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: { ...response },
      })
      expect(result).toBe(false)
    })

    it('returns false if selected values are equal but ordered differently', () => {
      const response = generateResponseV4(BasicField.Checkbox, {
        value: ['a', 'b'],
      })
      const prevResponse = generateResponseV4(BasicField.Checkbox, {
        value: ['b', 'a'],
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(false)
    })

    it('returns false if othersInput changes between undefined and empty string', () => {
      const response = generateResponseV4(BasicField.Checkbox, {
        value: ['a'],
      })
      const prevResponse = generateResponseV4(BasicField.Checkbox, {
        value: ['a'],
        othersInput: '',
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(false)
    })

    it('returns true if the othersInput value is different', () => {
      const response = generateResponseV4(BasicField.Checkbox, {
        value: ['a'],
        othersInput: 'new input',
      })
      const prevResponse = generateResponseV4(BasicField.Checkbox, {
        value: ['a'],
        othersInput: 'old input',
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true when new othersInput is added', () => {
      const response = generateResponseV4(BasicField.Checkbox, {
        value: ['a'],
        othersInput: 'new input',
      })
      const prevResponse = generateResponseV4(BasicField.Checkbox, {
        value: ['a'],
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true if no previous response is present', () => {
      const response = generateResponseV4(BasicField.Checkbox, {
        value: ['a', 'b'],
      })
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: undefined,
      })
      expect(result).toBe(true)
    })

    it('returns true if selected values have changed', () => {
      const response = generateResponseV4(BasicField.Checkbox, {
        value: ['a', 'b'],
      })
      const prevResponse = generateResponseV4(BasicField.Checkbox, {
        value: ['b', 'c'],
      })
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })
  })

  describe('table field type', () => {
    const generateTableAnswerV4 = (rows: Record<string, string>[]) =>
      Object.fromEntries(
        rows.map((value, index) => [
          `row${index + 1}`,
          { rowNum: index + 1, value },
        ]),
      )

    it('returns false if previous response is present but has not changed', () => {
      const response = generateResponseV4(
        BasicField.Table,
        generateTableAnswerV4([
          {
            '000000000000000000000001': 'hello',
            '000000000000000000000002': 'world',
          },
        ]),
      )
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: { ...response },
      })
      expect(result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateResponseV4(
        BasicField.Table,
        generateTableAnswerV4([
          {
            '000000000000000000000001': 'hello',
            '000000000000000000000002': 'world',
          },
        ]),
      )
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: undefined,
      })
      expect(result).toBe(true)
    })

    it('returns true if response row content has changed', () => {
      const response = generateResponseV4(
        BasicField.Table,
        generateTableAnswerV4([
          {
            '000000000000000000000001': 'hello',
            '000000000000000000000002': 'new world',
          },
        ]),
      )
      const prevResponse = generateResponseV4(
        BasicField.Table,
        generateTableAnswerV4([
          {
            '000000000000000000000001': 'hello',
            '000000000000000000000002': 'old world',
          },
        ]),
      )
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true if number of rows has changed', () => {
      const response = generateResponseV4(
        BasicField.Table,
        generateTableAnswerV4([
          {
            '000000000000000000000001': 'hello',
            '000000000000000000000002': 'world',
          },
          {
            '000000000000000000000001': 'hello2',
            '000000000000000000000002': 'world2',
          },
        ]),
      )
      const prevResponse = generateResponseV4(
        BasicField.Table,
        generateTableAnswerV4([
          {
            '000000000000000000000001': 'hello',
            '000000000000000000000002': 'world',
          },
        ]),
      )
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })
  })

  describe('attachment field type', () => {
    const generateAttachmentAnswerV4 = ({
      value = 'test answer',
      filename = 'test.txt',
      content = Buffer.from('test content'),
    }: {
      value?: string
      filename?: string
      content?: Buffer
    } = {}) => ({
      value,
      hasBeenScanned: false,
      filename,
      content,
    })

    it('returns false if previous response is present but has not changed', () => {
      const response = generateResponseV4(
        BasicField.Attachment,
        generateAttachmentAnswerV4(),
      )
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: { ...response },
      })
      expect(result).toBe(false)
    })

    it('returns true if no previous response is present', () => {
      const response = generateResponseV4(
        BasicField.Attachment,
        generateAttachmentAnswerV4(),
      )
      const result = checkIsResponseChangedV4({
        response,
        prevResponse: undefined,
      })
      expect(result).toBe(true)
    })

    it('returns true if response content has changed', () => {
      const response = generateResponseV4(
        BasicField.Attachment,
        generateAttachmentAnswerV4({ content: Buffer.from('new content') }),
      )
      const prevResponse = generateResponseV4(
        BasicField.Attachment,
        generateAttachmentAnswerV4({ content: Buffer.from('old content') }),
      )
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true if response value has changed', () => {
      const response = generateResponseV4(
        BasicField.Attachment,
        generateAttachmentAnswerV4({ value: 'new answer' }),
      )
      const prevResponse = generateResponseV4(
        BasicField.Attachment,
        generateAttachmentAnswerV4({ value: 'old answer' }),
      )
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })

    it('returns true if response filename has changed', () => {
      const response = generateResponseV4(
        BasicField.Attachment,
        generateAttachmentAnswerV4({ filename: 'new.txt' }),
      )
      const prevResponse = generateResponseV4(
        BasicField.Attachment,
        generateAttachmentAnswerV4({ filename: 'old.txt' }),
      )
      const result = checkIsResponseChangedV4({ response, prevResponse })
      expect(result).toBe(true)
    })
  })
})
