import {
  BasicField,
  CorppassAttribute,
  Language,
  MyInfoAttribute,
} from 'formsg-shared/types'
import { Schema } from 'mongoose'
import UIDGenerator from 'uid-generator'

import { IFieldSchema, IMyInfoSchema, ITableFieldSchema } from '../../../types'

const uidgen3 = new UIDGenerator(256, UIDGenerator.BASE62)

const VALID_FIELD_TYPES = Object.values(BasicField)

export const MyInfoSchema = new Schema<IMyInfoSchema>(
  {
    attr: {
      type: String,
      enum: Object.values(MyInfoAttribute),
      validate: {
        validator: function (this: IMyInfoSchema, attr: MyInfoAttribute) {
          return (
            attr !== MyInfoAttribute.UinFin ||
            this.parent().fieldType === BasicField.Nric
          )
        },
        message: 'The MyInfo NRIC / FIN source requires an NRIC field',
      },
    },
  },
  {
    _id: false,
  },
)

export const createAttrSourceSchema = (values: readonly string[]) =>
  new Schema(
    { attr: { type: String, enum: values, required: true } },
    { _id: false },
  )

const CORPPASS_ATTR_FIELD_TYPE: Record<CorppassAttribute, BasicField> = {
  [CorppassAttribute.Uen]: BasicField.Uen,
  [CorppassAttribute.Uid]: BasicField.ShortText,
}

export const BaseFieldSchema = new Schema<IFieldSchema>(
  {
    globalId: String,
    corppass: {
      type: createAttrSourceSchema(Object.values(CorppassAttribute)),
      default: undefined,
      validate: {
        validator: function (this: IFieldSchema) {
          if (!this.corppass) return true
          return (
            !this.myInfo &&
            CORPPASS_ATTR_FIELD_TYPE[this.corppass.attr] === this.fieldType
          )
        },
        message:
          'Corppass sources require the matching field type and no MyInfo source',
      },
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    fieldType: {
      type: String,
      enum: Object.values(BasicField),
      required: true,
    },
    titleTranslations: {
      type: [
        {
          language: {
            type: String,
            enum: Object.values(Language),
          },
          translation: {
            type: String,
          },
        },
      ],
      default: [],
      _id: false,
    },
    descriptionTranslations: {
      type: [
        {
          language: {
            type: String,
            enum: Object.values(Language),
          },
          translation: {
            type: String,
          },
        },
      ],
      default: [],
      _id: false,
    },
  },
  {
    discriminatorKey: 'fieldType',
  },
)

// Hooks
BaseFieldSchema.pre<IFieldSchema>('validate', function (next) {
  // Invalid field types
  if (!VALID_FIELD_TYPES.includes(this.fieldType)) {
    return next(Error('Field type is incorrect or unspecified'))
  }

  // No errors.
  return next()
})

BaseFieldSchema.pre<IFieldSchema>('save', function (next) {
  if (!this.globalId) {
    this.globalId = uidgen3.generateSync()
  }
  return next()
})

// Instance methods
BaseFieldSchema.methods.getQuestion = function (this: IFieldSchema) {
  // Return concatenation of all column titles as question string.
  if (isTableField(this)) {
    const columnTitles = this.columns.map((col) => col.title)
    return `${this.title} (${columnTitles.join(', ')})`
  }

  // Default question is the field title.
  return this.title
}

// Typeguards
const isTableField = (field: IFieldSchema): field is ITableFieldSchema => {
  return field.fieldType === BasicField.Table
}
