import { ObjectId } from 'bson'

import {
  ProcessedAttachmentResponse,
  ProcessedCheckboxResponse,
  ProcessedSingleAnswerResponse,
  ProcessedTableResponse,
} from 'src/app/modules/submission/submission.types'
import {
  AttachmentSize,
  BasicField,
  IAttachmentFieldSchema,
  ICheckboxFieldSchema,
  IDropdownField,
  IField,
  IFieldSchema,
  IImageFieldSchema,
  IShortTextFieldSchema,
  ITableFieldSchema,
} from 'src/types'

export const generateDefaultField = (
  fieldType: BasicField,
  customParams?: Partial<IField>,
): IFieldSchema => {
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
    default:
      return {
        ...defaultParams,
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IFieldSchema
  }
}

export const generateSingleAnswerResponse = (
  field: IFieldSchema,
  answer = 'answer',
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
    fieldType: field.fieldType as Exclude<
      BasicField,
      BasicField.Table | BasicField.Checkbox
    >,
    isVisible: true,
  }
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
    _id: new ObjectId().toHexString,
    question: `${fieldType} question`,
    answer: `${fieldType} answer`,
    fieldType: fieldType as Exclude<
      BasicField,
      BasicField.Table | BasicField.Checkbox
    >,
    isVisible: true,
    ...customParams,
  }
}

export const generateAttachmentResponse = (
  field: IAttachmentFieldSchema,
  filename = 'filename',
  content = Buffer.from('content'),
): ProcessedAttachmentResponse => ({
  _id: field._id,
  question: field.title,
  answer: 'answer',
  fieldType: BasicField.Attachment,
  filename,
  content,
  isVisible: true,
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
): ProcessedCheckboxResponse => ({
  _id: field._id,
  question: field.title,
  answerArray: answerArray ?? [field.fieldOptions[0]],
  fieldType: BasicField.Checkbox,
  isVisible: true,
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
  answerArray?: string[][],
): ProcessedTableResponse => {
  if (!answerArray) {
    const rowAnswer: string[] = []
    field.columns.forEach((col) => {
      switch (col.columnType) {
        case BasicField.ShortText:
          rowAnswer.push('answer')
          break
        case BasicField.Dropdown:
          rowAnswer.push(((col as unknown) as IDropdownField).fieldOptions[0])
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
  ],
  fieldType: BasicField.Table,
  isVisible: true,
  ...customParams,
})
