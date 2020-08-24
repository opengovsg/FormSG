import { Mongoose, Schema } from 'mongoose'
import UIDGenerator from 'uid-generator'

import {
  AuthType,
  BasicField,
  IFieldSchema,
  IMyInfoSchema,
  ITableFieldSchema,
  MyInfoAttribute,
  ResponseMode,
} from '../../../types'
import { isBetaField, userCanCreateField } from '../../utils/beta-permissions'
import getUserModel from '../user.server.model'

const uidgen3 = new UIDGenerator(256, UIDGenerator.BASE62)

const VALID_FIELD_TYPES = Object.values(BasicField)

export const MyInfoSchema = new Schema<IMyInfoSchema>(
  {
    attr: {
      type: String,
      enum: Object.values(MyInfoAttribute),
      validate: {
        validator: function (this: IMyInfoSchema) {
          const { authType, responseMode } = this.ownerDocument()
          return (
            authType === AuthType.SP && responseMode !== ResponseMode.Encrypt
          )
        },
        message:
          'MyInfo field is invalid. Check that your form has SingPass authentication enabled, or is not an encrypted mode form.',
      },
    },
  },
  {
    _id: false,
  },
)

const createBaseFieldSchema = (db: Mongoose) => {
  const User = getUserModel(db)

  const FieldSchema = new Schema<IFieldSchema>(
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
  FieldSchema.pre<IFieldSchema>('validate', function (next) {
    // Required due to inner scopes
    const thisField = this
    // Invalid field types
    if (!VALID_FIELD_TYPES.includes(thisField.fieldType)) {
      return next(Error('Field type is incorrect or unspecified'))
    }

    const { responseMode, admin } = thisField.parent()

    // Prevent MyInfo fields from being set in encrypt mode.
    if (responseMode === ResponseMode.Encrypt) {
      if (thisField.myInfo?.attr) {
        return next(
          Error('MyInfo fields are not allowed for storage mode forms'),
        )
      }
    }

    // Check if user is allowed to add this field.
    if (isBetaField(thisField)) {
      User.findById(admin, function (err, user) {
        if (err || !user) {
          return next(
            Error(
              `Error validating user permissions for ${thisField.fieldType} fields`,
            ),
          )
        }
        if (!userCanCreateField(user, thisField)) {
          return next(
            Error(
              `User is not allowed to access the beta feature - ${this.fieldType} fields`,
            ),
          )
        }
      })
    }

    return next()
  })

  FieldSchema.pre<IFieldSchema>('save', function (next) {
    if (!this.globalId) {
      this.globalId = uidgen3.generateSync()
    }
    return next()
  })

  // Instance methods
  FieldSchema.methods.getQuestion = function (this: IFieldSchema) {
    // Return concatenation of all column titles as question string.
    if (isTableField(this)) {
      const columnTitles = this.columns.map((col) => col.title)
      return `${this.title} (${columnTitles.join(', ')})`
    }

    // Default question is the field title.
    return this.title
  }

  return FieldSchema
}

// Typeguards
const isTableField = (field: IFieldSchema): field is ITableFieldSchema => {
  return field.fieldType === BasicField.Table
}

export default createBaseFieldSchema
