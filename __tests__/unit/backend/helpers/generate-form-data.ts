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
  IDateFieldSchema,
  IDecimalFieldSchema,
  IDropdownFieldSchema,
  IHomenoFieldSchema,
  IImageFieldSchema,
  IMobileFieldSchema,
  INumberFieldSchema,
  IRatingFieldSchema,
  IShortTextFieldSchema,
  ITableFieldSchema,
  SingleAnswerFieldResponse,
} from 'src/types'
import {
  ParsedClearAttachmentFieldResponseV3,
  ParsedClearAttachmentResponseV3,
} from 'src/types/api'

import {
  AllowMyInfoBase,
  AttachmentSize,
  BasicField,
  CheckboxFieldResponsesV3,
  CheckboxResponse,
  CheckboxResponseV3,
  Column,
  DropdownFieldBase,
  EmailResponseV3,
  FormField,
  FormFieldDto,
  GenericStringAnswerFieldResponseV3,
  MobileResponseV3,
  RadioFieldResponsesV3,
  RadioResponseV3,
  ShortTextFieldBase,
  StringAnswerResponseV3,
  TableFieldResponsesV3,
  TableResponseV3,
  TableRow,
  VerifiableFieldResponseV3,
  YesNoFieldResponseV3,
  YesNoResponseV3,
} from '../../../../shared/types'

export const generateDefaultFieldV3 = (
  fieldType: BasicField,
  customParams?: Partial<FormField> & { _id?: string },
): FormFieldDto => {
  return generateDefaultField(fieldType, customParams) as FormFieldDto
}

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
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IRatingFieldSchema
    case BasicField.Date:
      return {
        ...defaultParams,
        invalidDays: [],
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as IDateFieldSchema
    case BasicField.Number:
      return {
        ...defaultParams,
        ValidationOptions: {
          selectedValidation: null,
          LengthValidationOptions: {
            selectedLengthValidation: null,
            customVal: null,
          },
          RangeValidationOptions: {
            customMin: null,
            customMax: null,
          },
        },
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as INumberFieldSchema
    default:
      return {
        ...defaultParams,
        getQuestion: () => defaultParams.title,
        ...customParams,
      } as FormFieldSchema
  }
}

export const generateProcessedSingleAnswerResponse = ({
  field,
  answer = 'answer',
  signature,
  myInfo,
}: {
  field: FormFieldSchema
  answer: string
  signature?: string
  myInfo?: AllowMyInfoBase['myInfo']
}): ProcessedSingleAnswerResponse => {
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
    myInfo,
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
    answerArray = Array(field.minimumRows || 0).fill(rowAnswer)
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
  customParams?: Partial<DropdownFieldBase> & { _id?: string },
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
  customParams?: Partial<ShortTextFieldBase> & { _id?: string },
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

export const generateGenericStringAnswerResponseV3 = ({
  fieldType,
  answer = 'answer',
}: {
  fieldType: GenericStringAnswerFieldResponseV3['fieldType']
  answer: StringAnswerResponseV3
}): GenericStringAnswerFieldResponseV3 => {
  return {
    fieldType,
    answer,
  }
}

export const generateYesNoAnswerResponseV3 = (
  answer: YesNoFieldResponseV3 = 'Yes',
): YesNoResponseV3 => {
  return {
    fieldType: BasicField.YesNo,
    answer: answer,
  }
}

export const generateAttachmentResponseV3 = (
  answer: ParsedClearAttachmentFieldResponseV3 = {
    filename: 'Attachment filename',
    content: Buffer.from('Attachment content'),
    answer: 'Attachment answer',
    hasBeenScanned: false,
  },
): ParsedClearAttachmentResponseV3 => {
  return {
    fieldType: BasicField.Attachment,
    answer,
  }
}

export const generateVerifiableAnswerResponseV3 = ({
  fieldType,
  answer,
}: {
  fieldType: BasicField.Email | BasicField.Mobile
  answer: VerifiableFieldResponseV3
}): EmailResponseV3 | MobileResponseV3 => {
  return {
    fieldType,
    answer,
  }
}

export const generateTableResponseV3 = (
  answer: TableFieldResponsesV3,
): TableResponseV3 => {
  return {
    fieldType: BasicField.Table,
    answer,
  }
}

export const generateRadioResponseV3 = (
  answer: RadioFieldResponsesV3,
): RadioResponseV3 => {
  return {
    fieldType: BasicField.Radio,
    answer,
  }
}

export const generateCheckboxResponseV3 = (
  answer: CheckboxFieldResponsesV3,
): CheckboxResponseV3 => {
  return {
    fieldType: BasicField.Checkbox,
    answer,
  }
}
