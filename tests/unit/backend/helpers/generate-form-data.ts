/* eslint-disable typesafe/no-throw-sync-func */
import { ObjectId } from 'bson'
import { pick } from 'lodash'

import {
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from 'src/app/modules/submission/submission.types'
import {
  FormFieldSchema,
  IAttachmentFieldSchema,
  IAttachmentResponse,
  ICheckboxFieldSchema,
  ICountryRegionFieldSchema,
  IDecimalFieldSchema,
  IDropdownFieldSchema,
  IHomenoFieldSchema,
  IImageFieldSchema,
  IMobileFieldSchema,
  IRatingFieldSchema,
  IShortTextFieldSchema,
  ITableFieldSchema,
  SingleAnswerFieldResponse,
} from 'src/types'

import {
  AttachmentSize,
  BasicField,
  CheckboxResponse,
  Column,
  DropdownFieldBase,
  FormField,
  ShortTextFieldBase,
  TableRow,
} from '../../../../shared/types'

export const generateDefaultField = (
  fieldType: BasicField,
  customParams?: Partial<FormField> & { _id?: string },
): FormFieldSchema => {
  const defaultParams = {
    title: `test ${fieldType} field title`,
    _id: new ObjectId().toHexString(),
    description: `${fieldType} description`,
    globalId: new ObjectId().toHexString(),
    fieldType,
    required: true,
    disabled: false,
  }
  switch (fieldType) {
    case BasicField.Table:
      return {
        minimumRows: 1,
        addMoreRows: false,
        columns: [
          {
            title: 'Test Column Title 1',
            required: true,
            columnType: BasicField.ShortText,
          },
          {
            title: 'Test Column Title 2',
            required: true,
            columnType: BasicField.Dropdown,
          },
        ],
        getQuestion: () => 'title (Column 1, Column 2)',
        ...defaultParams,
        ...customParams,
      } as ITableFieldSchema
    case BasicField.Checkbox:
      return {
        ...defaultParams,
        fieldOptions: ['Option 1', 'Option 2'],
        getQuestion: () => defaultParams.title,
        ValidationOptions: {
          customMin: null,
          customMax: null,
        },
        othersRadioButton: false,
        validateByValue: false,
        ...customParams,
      } as ICheckboxFieldSchema
    case BasicField.Attachment:
      return {
        ...defaultParams,
        attachmentSize: AttachmentSize.ThreeMb,
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IAttachmentFieldSchema
    case BasicField.Image:
      return {
        ...defaultParams,
        url: 'http://example.com',
        fileMd5Hash: 'some hash',
        name: 'test image name',
        size: 'some size',
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IImageFieldSchema
    case BasicField.ShortText:
      return {
        ...defaultParams,
        ValidationOptions: {
          selectedValidation: null,
        },
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IShortTextFieldSchema
    case BasicField.Dropdown:
      return {
        ...defaultParams,
        fieldOptions: ['Option 1', 'Option 2'],
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IDropdownFieldSchema
    case BasicField.CountryRegion:
      return {
        ...defaultParams,
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as ICountryRegionFieldSchema
    case BasicField.Decimal:
      return {
        ...defaultParams,
        ValidationOptions: {
          customMin: null,
          customMax: null,
        },
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IDecimalFieldSchema
    case BasicField.Mobile:
      return {
        ...defaultParams,
        allowIntlNumbers: false,
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IMobileFieldSchema
    case BasicField.HomeNo:
      return {
        ...defaultParams,
        allowIntlNumbers: false,
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IHomenoFieldSchema
    case BasicField.Rating:
      return {
        ...defaultParams,
        ratingOptions: {
          shape: 'Heart',
          steps: 5,
        },
        ...customParams,
      } as IRatingFieldSchema
    default:
      return {
        ...defaultParams,
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as FormFieldSchema
  }
}

export const generateProcessedSingleAnswerResponse = (
  field: FormFieldSchema,
  answer = 'answer',
  signature?: string,
): ProcessedSingleAnswerResponse => {
  if (
    [BasicField.Attachment, BasicField.Table, BasicField.Checkbox].includes(
      field.fieldType,
    )
  ) {
    throw new Error(
      'Call the custom response generator functions for attachment, table and checkbox.',
    )
  }
  return {
    _id: field._id,
    question: field.title,
    answer,
    fieldType: field.fieldType,
    isVisible: true,
    signature,
  } as ProcessedSingleAnswerResponse
}

export const generateSingleAnswerResponse = (
  field: FormFieldSchema,
  answer = field.fieldType === BasicField.Section ? '' : 'answer',
  signature?: string,
): SingleAnswerFieldResponse => {
  if (
    [BasicField.Attachment, BasicField.Table, BasicField.Checkbox].includes(
      field.fieldType,
    )
  ) {
    throw new Error(
      'Call the custom response generator functions for attachment, table and checkbox.',
    )
  }
  return {
    _id: field._id,
    answer,
    fieldType: field.fieldType,
    signature,
  } as SingleAnswerFieldResponse
}

export const generateNewSingleAnswerResponse = (
  fieldType: BasicField,
  customParams?: Partial<ProcessedSingleAnswerResponse>,
): ProcessedSingleAnswerResponse => {
  if (
    [BasicField.Attachment, BasicField.Table, BasicField.Checkbox].includes(
      fieldType,
    )
  ) {
    throw new Error(
      'Call the custom response generator functions for attachment, table and checkbox.',
    )
  }
  return {
    _id: new ObjectId().toHexString(),
    question: `${fieldType} question`,
    answer: `${fieldType} answer`,
    fieldType: fieldType,
    isVisible: true,
    ...customParams,
  } as ProcessedSingleAnswerResponse
}

export const generateUnprocessedSingleAnswerResponse = (
  fieldType: BasicField,
  customParams?: Partial<SingleAnswerFieldResponse>,
): SingleAnswerFieldResponse => {
  return pick(generateNewSingleAnswerResponse(fieldType, customParams), [
    '_id',
    'question',
    'fieldType',
    'answer',
  ]) as SingleAnswerFieldResponse
}

export const generateAttachmentResponse = (
  field: IAttachmentFieldSchema,
  filename = 'filename',
  content = Buffer.from('content'),
): IAttachmentResponse => ({
  question: 'question',
  _id: field._id,
  answer: 'answer',
  fieldType: BasicField.Attachment,
  filename,
  content,
})

export const generateNewAttachmentResponse = (
  customParams?: Partial<ProcessedAttachmentResponse>,
): ProcessedAttachmentResponse => ({
  _id: new ObjectId().toHexString(),
  question: `Attachment question`,
  answer: 'Attachment answer',
  fieldType: BasicField.Attachment,
  filename: 'Attachment filename',
  content: Buffer.from('Attachment content'),
  isVisible: true,
  ...customParams,
})

export const generateCheckboxResponse = (
  field: ICheckboxFieldSchema,
  answerArray?: string[],
): CheckboxResponse => ({
  question: 'question',
  _id: field._id,
  answerArray: answerArray ?? [field.fieldOptions[0]],
  fieldType: BasicField.Checkbox,
})

export const generateNewCheckboxResponse = (
  customParams?: Partial<ProcessedCheckboxResponse>,
): ProcessedCheckboxResponse => ({
  _id: new ObjectId().toHexString(),
  question: `Checkbox question`,
  answerArray: ['Checkbox answer 1', 'Checkbox answer 2'],
  fieldType: BasicField.Checkbox,
  isVisible: true,
  ...customParams,
})

export const generateTableResponse = (
  field: ITableFieldSchema,
  answerArray?: TableRow[],
): ProcessedTableResponse => {
  if (!answerArray) {
    const rowAnswer: string[] = []
    field.columns.forEach((col) => {
      switch (col.columnType) {
        case BasicField.ShortText:
          rowAnswer.push('answer')
          break
        case BasicField.Dropdown:
          rowAnswer.push(col.fieldOptions[0])
      }
    })
    answerArray = Array(field.minimumRows).fill(rowAnswer)
  }
  return {
    _id: field._id,
    question: field.title,
    answerArray,
    fieldType: BasicField.Table,
    isVisible: true,
  }
}

export const generateNewTableResponse = (
  customParams?: Partial<ProcessedTableResponse>,
): ProcessedTableResponse => ({
  _id: new ObjectId().toHexString(),
  question: 'Table question',
  answerArray: [
    ['Table 1', 'Table 2'],
    ['Table 3', 'Table 4'],
  ] as TableRow[],
  fieldType: BasicField.Table,
  isVisible: true,
  ...customParams,
})

export const generateTableDropdownColumn = (
  customParams?: Partial<DropdownFieldBase>,
): Column => {
  return {
    title: 'some title',
    columnType: BasicField.Dropdown,
    required: true,
    _id: new ObjectId().toHexString(),
    fieldOptions: ['a', 'b', 'c'],
    ...customParams,
    toObject() {
      // mock toObject method of mongoose document
      return {
        title: 'some title',
        columnType: BasicField.Dropdown,
        required: true,
        _id: new ObjectId().toHexString(),
        fieldOptions: ['a', 'b', 'c'],
        ...customParams,
      }
    },
  } as Column
}

export const generateTableShortTextColumn = (
  customParams?: Partial<ShortTextFieldBase>,
): Column => {
  return {
    title: 'some title',
    columnType: BasicField.ShortText,
    required: true,
    _id: new ObjectId().toHexString(),
    ValidationOptions: {
      customVal: null,
      selectedValidation: null,
    },
    ...customParams,
    toObject() {
      // mock toObject method of mongoose document
      return {
        title: 'some title',
        columnType: BasicField.ShortText,
        required: true,
        _id: new ObjectId().toHexString(),
        ValidationOptions: {
          customVal: null,
          selectedValidation: null,
        },
        ...customParams,
      }
    },
  } as Column
}
