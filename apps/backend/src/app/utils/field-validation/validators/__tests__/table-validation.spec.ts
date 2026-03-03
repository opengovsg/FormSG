import {
  generateDefaultField,
  generateDefaultFieldV3,
  generateNewTableResponse,
  generateTableDropdownColumn,
  generateTableResponseV3,
  generateTableShortTextColumn,
} from '__tests__/unit/backend/helpers/generate-form-data'
import { ObjectId } from 'bson'

import { ValidateFieldError } from 'src/app/modules/submission/submission.errors'
import { validateField, validateFieldV3 } from 'src/app/utils/field-validation'

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

describe('Table validation V3', () => {
  const formId = 'mockFormId'
  const COL1_ID = '000000000000000000000001'
  const COL2_ID = '000000000000000000000002'

  describe('Dropdown column', () => {
    it('should disallow empty submissions if columns are required', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [generateTableDropdownColumn({ _id: COL1_ID })],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: '',
        },
      ])
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions for not required columns', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID, required: false }),
        ],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: '',
        },
      ])
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow valid submission for dropdown column', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({
            _id: COL1_ID,
            fieldOptions: ['a', 'b', 'c'],
          }),
        ],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'a',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow values not found in field options for dropdown column', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({
            _id: COL1_ID,
            fieldOptions: ['a', 'b', 'c'],
          }),
        ],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'x',
        },
      ])
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })

  describe('Textfield column', () => {
    it('should disallow empty submissions if columns are required', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [generateTableShortTextColumn({ _id: COL1_ID })],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: '',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow empty submissions for not required columns', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableShortTextColumn({ _id: COL1_ID, required: false }),
        ],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: '',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should allow valid submission for textfield column', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [generateTableShortTextColumn({ _id: COL1_ID })],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'Hello!',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('Multiple columns and rows', () => {
    it('should allow valid submissions for multiple columns', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({
            _id: COL1_ID,
            fieldOptions: ['a', 'b', 'c'],
          }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'a',
          [COL2_ID]: 'hello',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow input with number of columns that do not match', () => {
      const extraColumnId = '000000000000000000000003'
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'a',
          [COL2_ID]: 'text1',
          [extraColumnId]: 'text2',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow valid submissions for multiple rows', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
        minimumRows: 2,
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'a',
          [COL2_ID]: 'text1',
        },
        {
          [COL1_ID]: 'b',
          [COL2_ID]: 'text2',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow invalid submissions for multiple rows', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
        minimumRows: 2,
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'a',
          [COL2_ID]: 'hello',
        },
        {
          [COL1_ID]: 'x',
          [COL2_ID]: 'world',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })

  describe('Number of rows', () => {
    it('should allow submissions with zero rows if minimum rows not set', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
        minimumRows: '',
      })
      const response = generateTableResponseV3([])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })

    it('should disallow submissions with zero rows if minimum rows set to 1', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
        minimumRows: 1,
      })
      const response = generateTableResponseV3([])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow submissions with fewer than min rows', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
        minimumRows: 2,
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'a',
          [COL2_ID]: 'hello',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow submissions with more rows than min rows if addMoreRows is not set', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
        minimumRows: 2,
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'a',
          [COL2_ID]: 'hello',
        },
        {
          [COL1_ID]: 'b',
          [COL2_ID]: 'helloagain',
        },
        {
          [COL1_ID]: 'c',
          [COL2_ID]: 'helloyetagain',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should disallow submissions with more than max rows if max rows is set and addMoreRows is configured for that field', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [
          generateTableDropdownColumn({ _id: COL1_ID }),
          generateTableShortTextColumn({ _id: COL2_ID }),
        ],
        minimumRows: 2,
        maximumRows: 3,
        addMoreRows: true,
      })
      const response = generateTableResponseV3([
        {
          [COL1_ID]: 'a',
          [COL2_ID]: 'hello',
        },
        {
          [COL1_ID]: 'b',
          [COL2_ID]: 'helloagain',
        },
        {
          [COL1_ID]: 'c',
          [COL2_ID]: 'helloyetagain',
        },
        {
          [COL1_ID]: 'd',
          [COL2_ID]: 'helloyetagainagain',
        },
      ])

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })

    it('should allow submissions with unlimited rows if max rows is not set and addMoreRows is configured for that field', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [generateTableShortTextColumn({ _id: COL1_ID })],
        maximumRows: undefined,
        addMoreRows: true,
      })
      const response = generateTableResponseV3(
        Array(100).fill({
          [COL1_ID]: 'hello',
        }),
      )

      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isOk()).toBe(true)
      expect(validateResult._unsafeUnwrap()).toEqual(true)
    })
  })

  describe('Invalid input', () => {
    it('should disallow null input for text col', () => {
      const formField = generateDefaultFieldV3(BasicField.Table, {
        columns: [generateTableShortTextColumn({ _id: COL1_ID })],
      })

      const response = generateTableResponseV3([
        {
          [COL1_ID]: null as unknown as string,
        },
      ])
      const validateResult = validateFieldV3({
        formId,
        formField,
        response,
        isVisible: true,
      })
      expect(validateResult.isErr()).toBe(true)
      expect(validateResult._unsafeUnwrapErr()).toEqual(
        new ValidateFieldError('Invalid answer submitted'),
      )
    })
  })

  it('should disallow null input for dropdown col', () => {
    const formField = generateDefaultFieldV3(BasicField.Table, {
      columns: [generateTableDropdownColumn({ _id: COL1_ID })],
    })

    const response = generateTableResponseV3([
      {
        [COL1_ID]: null as unknown as string,
      },
    ])
    const validateResult = validateFieldV3({
      formId,
      formField,
      response,
      isVisible: true,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Invalid answer submitted'),
    )
  })

  it('should disallow responses submitted for hidden fields', () => {
    const formField = generateDefaultFieldV3(BasicField.Table, {
      columns: [generateTableShortTextColumn({ _id: COL1_ID })],
    })
    const response = generateTableResponseV3([
      {
        [COL1_ID]: 'hello',
      },
    ])

    const validateResult = validateFieldV3({
      formId,
      formField,
      response,
      isVisible: false,
    })
    expect(validateResult.isErr()).toBe(true)
    expect(validateResult._unsafeUnwrapErr()).toEqual(
      new ValidateFieldError('Attempted to submit response on a hidden field'),
    )
  })
})
