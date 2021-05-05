import { Schema } from 'mongoose'
import UIDGenerator from 'uid-generator'

import {
  BasicField,
  IFieldSchema,
  IMyInfoSchema,
  ITableFieldSchema,
  MyInfoAttribute,
  ResponseMode,
} from 'src/types'

const uidgen3 = new UIDGenerator(256, UIDGenerator.BASE62)

const VALID_FIELD_TYPES = Object.values(BasicField)

export const MyInfoSchema = new Schema<IMyInfoSchema>(
  {
    attr: {
      type: String,
      enum: Object.values(MyInfoAttribute),
    },
  },
  {
    _id: false,
  },
)

export const BaseFieldSchema = new Schema<IFieldSchema>(
  {
    globalId: String,
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

  // Prevent MyInfo fields from being set in encrypt mode.
  if (this.parent().responseMode === ResponseMode.Encrypt) {
    if (this.myInfo?.attr) {
      return next(Error('MyInfo fields are not allowed for storage mode forms'))
    }
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
