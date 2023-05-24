import {
  generateDefaultField,
  generateNewTableResponse,
  generateTableDropdownColumn,
  generateTableShortTextColumn,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { ObjectId } from 'bson'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField } from 'src/app/utils/field-validation'

import { BasicField, TableRow } from '../../../../../../shared/types'

describe('Table validation', () => {
  const formId = new ObjectId().toHexString()
  describe('Dropdown column', () => {
    it('should disallow empty submissions if columns are required', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableDropdownColumn()],
      })
      const response = generateNewTableResponse({
        answerArray: [[''] as TableRow],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions for optional columns', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableDropdownColumn({ required: false })],
      })
      const response = generateNewTableResponse({
        answerArray: [[''] as TableRow],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow valid submission for dropdown column', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableDropdownColumn()],
      })
      const response = generateNewTableResponse({
        answerArray: [['a'] as TableRow],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow values not found in field options for dropdown column', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableDropdownColumn()],
      })
      const response = generateNewTableResponse({
        answerArray: [['x'] as TableRow],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })
  describe('Textfield column', () => {
    it('should disallow empty submissions if columns are required', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableShortTextColumn()],
      })
      const response = generateNewTableResponse({
        answerArray: [[''] as TableRow],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions for optional columns', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableShortTextColumn({ required: false })],
      })
      const response = generateNewTableResponse({
        answerArray: [[''] as TableRow],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow valid submission for textfield column', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableShortTextColumn()],
      })
      const response = generateNewTableResponse({
        answerArray: [['Hello!'] as TableRow],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })
  describe('Multiple columns and rows', () => {
    it('should allow valid submissions for multiple columns', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [
          generateTableDropdownColumn(),
          generateTableShortTextColumn(),
        ],
      })
      const response = generateNewTableResponse({
        answerArray: [['a', 'hello'] as TableRow],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow input with number of columns that do not match', () => {
      // WRONG
      const formField = generateDefaultField(BasicField.Table, {
        columns: [
          generateTableDropdownColumn(),
          generateTableShortTextColumn(),
          generateTableShortTextColumn(),
        ],
      })
      const response = generateNewTableResponse({
        answerArray: [['a', 'text1', 'text2', 'text3'] as TableRow],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow valid submissions for multiple rows', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [
          generateTableDropdownColumn(),
          generateTableShortTextColumn(),
        ],
        minimumRows: 2,
      })
      const response = generateNewTableResponse({
        answerArray: [
          ['a', 'text1'],
          ['b', 'text2'],
        ] as TableRow[],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow invalid submissions for multiple rows', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [
          generateTableDropdownColumn(),
          generateTableShortTextColumn(),
        ],
        minimumRows: 2,
      })
      const response = generateNewTableResponse({
        answerArray: [
          ['a', 'hello'],
          ['x', 'world'], // Invalid dropdown value for second row
        ] as TableRow[],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })
  describe('Number of rows', () => {
    it('should disallow submissions with fewer than min rows', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [
          generateTableDropdownColumn(),
          generateTableShortTextColumn(),
        ],
        minimumRows: 2,
      })
      const response = generateNewTableResponse({
        answerArray: [['a', 'hello'] as TableRow],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow submissions with more rows than min rows if addMoreRows is not set', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [
          generateTableDropdownColumn(),
          generateTableShortTextColumn(),
        ],
        minimumRows: 2,
      })
      const response = generateNewTableResponse({
        answerArray: [
          ['a', 'hello'],
          ['b', 'helloagain'],
          ['c', 'helloyetagain'],
        ] as TableRow[],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow submissions with more than max rows if max rows is set and addMoreRows is configured for that field', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [
          generateTableDropdownColumn(),
          generateTableShortTextColumn(),
        ],
        minimumRows: 2,
        maximumRows: 3,
        addMoreRows: true,
      })
      const response = generateNewTableResponse({
        answerArray: [
          ['a', 'hello'],
          ['b', 'helloagain'],
          ['c', 'helloyetagain'],
          ['d', 'helloyetagainagain'],
        ] as TableRow[],
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submissions with unlimited rows if max rows is not set and addMoreRows is configured for that field', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableShortTextColumn()],
        maximumRows: undefined,
        addMoreRows: true,
      })
      const response = generateNewTableResponse({
        answerArray: Array(100).fill(['hello']),
      })

      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })
  describe('Invalid input', () => {
    it('should disallow null input', () => {
      const formField = generateDefaultField(BasicField.Table, {
        columns: [generateTableShortTextColumn()],
      })
      const response = generateNewTableResponse({
        answerArray: [[null as unknown as string] as TableRow],
      })
      const validateResult = validateField(formId, formField, response)
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Response has invalid shape'),
      )
    })
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultField(BasicField.Table, {
      columns: [generateTableShortTextColumn()],
    })
    const response = generateNewTableResponse({
      isVisible: false,
      answerArray: [['hello'] as TableRow],
    })

    const validateResult = validateField(formId, formField, response)
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
