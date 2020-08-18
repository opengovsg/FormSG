import BSON from 'bson-ext'
import { compact, pick, uniq } from 'lodash'
import { Model, Mongoose, Schema, SchemaOptions } from 'mongoose'
import validator from 'validator'

import { FORM_DUPLICATE_KEYS } from '../../shared/constants'
import { validateWebhookUrl } from '../../shared/util/webhook-validation'
import {
  AuthType,
  BasicFieldType,
  Colors,
  FormLogoState,
  IEmailFormSchema,
  IEncryptedFormSchema,
  IFormSchema,
  IPopulatedForm,
  LogicType,
  OtpData,
  Permission,
  ResponseMode,
  Status,
} from '../../types'
import { MB } from '../utils/constants'

import getAgencyModel from './agency.server.model'
import {
  createAttachmentFieldSchema,
  createBaseFieldSchema,
  createCheckboxFieldSchema,
  createDateFieldSchema,
  createDecimalFieldSchema,
  createDropdownFieldSchema,
  createEmailFieldSchema,
  createHomenoFieldSchema,
  createImageFieldSchema,
  createLongTextFieldSchema,
  createMobileFieldSchema,
  createNricFieldSchema,
  createNumberFieldSchema,
  createRadioFieldSchema,
  createRatingFieldSchema,
  createSectionFieldSchema,
  createShortTextFieldSchema,
  createStatementFieldSchema,
  createTableFieldSchema,
  createYesNoFieldSchema,
} from './field'
import LogicSchema, {
  PreventSubmitLogicSchema,
  ShowFieldsLogicSchema,
} from './form_logic.server.schema'
import { CustomFormLogoSchema, FormLogoSchema } from './form_logo.server.schema'
import getUserModel from './user.server.model'

export const FORM_SCHEMA_ID = 'Form'

const bson = new BSON([
  BSON.Binary,
  BSON.Code,
  BSON.DBRef,
  BSON.Decimal128,
  BSON.Double,
  BSON.Int32,
  BSON.Long,
  BSON.Map,
  BSON.MaxKey,
  BSON.MinKey,
  BSON.ObjectId,
  BSON.BSONRegExp,
  BSON.Symbol,
  BSON.Timestamp,
])

const formSchemaOptions: SchemaOptions = {
  id: false,
  toJSON: {
    getters: true,
  },
  discriminatorKey: 'responseMode',
  read: 'nearest',
  timestamps: {
    createdAt: 'created',
    updatedAt: 'lastModified',
  },
}

export interface IFormModel extends Model<IFormSchema> {
  getOtpData(formId: string): Promise<OtpData | null>
  getFullFormById(formId: string): Promise<IPopulatedForm | null>
}

type IEncryptedFormModel = Model<IEncryptedFormSchema>

const EncryptedFormSchema = new Schema<IEncryptedFormSchema>({
  publicKey: {
    type: String,
    required: true,
  },
})

type IEmailFormModel = Model<IEmailFormSchema>

const EmailFormSchema = new Schema<IEmailFormSchema>({
  emails: {
    type: [
      {
        type: String,
        trim: true,
      },
    ],
    validate: {
      validator: (v: string[]) => {
        if (!Array.isArray(v) || v.length === 0) return false
        // Weird artifact of legacy code, emails are mostly a single
        // string of emails separated by commas.
        // Split the email strings into individual emails by commas (if
        // possible) and validate them.
        return v.every((emailString) =>
          emailString
            .split(',')
            .every((email) => validator.isEmail(email.trim())),
        )
      },
      message: 'Please provide valid email addresses',
    },
    // Mongoose v5 only checks if the type is an array, not whether the array
    // is non-empty.
    required: true,
  },
})

const compileFormModel = (db: Mongoose): IFormModel => {
  const Agency = getAgencyModel(db)
  const User = getUserModel(db)

  const BaseFieldSchema = createBaseFieldSchema(db)

  // Schema
  const FormSchema = new Schema<IFormSchema>(
    {
      title: {
        type: String,
        trim: true,
        required: 'Form name cannot be blank',
        minlength: [4, 'Form name must be at least 4 characters'],
        maxlength: [200, 'Form name can have a maximum of 200 characters'],
        match: [
          /^[a-zA-Z0-9_\-./() ]*$/,
          'Form name cannot contain special characters',
        ],
      },

      form_fields: [BaseFieldSchema],
      form_logics: [LogicSchema],

      admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: 'Form must have an Admin',
      },

      permissionList: {
        type: [
          {
            email: {
              type: String,
              trim: true,
              required: true,
            },
            write: {
              type: Boolean,
              default: false,
            },
          },
        ],
        validate: {
          validator: async (users: Permission[]) => {
            // Retrieve count of users that exist in the Agency collection.
            // Map is used instead of for...of loop so that this runs in
            // parallel.
            const areUsersExist = await Promise.all(
              users.map(async (user) => {
                const userEmail = user.email
                if (!userEmail) {
                  return false
                }
                const emailDomain = userEmail.split('@').pop()
                const result = await Agency.findOne({ emailDomain })
                return !!result
              }),
            )

            // Check if number of truthy values equal initial array length.
            return areUsersExist.filter(Boolean).length === users.length
          },
          message: 'Failed to update collaborators list.',
        },
      },

      startPage: {
        paragraph: String,
        estTimeTaken: Number,
        colorTheme: {
          type: String,
          enum: Object.values(Colors),
          default: Colors.Blue,
        },
        logo: FormLogoSchema,
      },

      logo: FormLogoSchema,

      endPage: {
        title: {
          type: String,
          default: 'Thank you for filling out the form.',
        },
        paragraph: String,
        buttonLink: String,
        buttonText: {
          type: String,
          default: 'Submit another form',
        },
      },

      hasCaptcha: {
        type: Boolean,
        default: true,
      },

      authType: {
        type: String,
        enum: Object.values(AuthType),
        default: AuthType.NIL,
        set: function (this: IFormSchema, v: AuthType) {
          // Do not allow authType to be changed if form is published
          if (this.authType !== v && this.status === Status.Public) {
            return this.authType
          } else {
            return v
          }
        },
      },

      customLogo: {
        type: String,
        match: [
          /$^|\.(gif|jpeg|jpg|png|svg)(\?|$|#)/i,
          'Please fill a valid image URL',
        ],
      },

      status: {
        type: String,
        enum: Object.values(Status),
        default: Status.Private,
        set: function (this: IFormSchema, v: Status) {
          if (
            this.status === Status.Private &&
            v === Status.Public &&
            this.authType !== AuthType.NIL &&
            !this.esrvcId
          ) {
            return Status.Private
          }

          return v
        },
      },

      // The subtext of the message shown on the error page if it is deactivated -
      // the header is "{{ title }} is not available."
      inactiveMessage: {
        type: String,
        default:
          'If you think this is a mistake, please contact the agency that gave you the form link.',
      },

      isListed: {
        type: Boolean,
        default: true,
      },
      esrvcId: {
        type: String,
        required: false,
        match: [
          /^([a-zA-Z0-9-]){1,25}$/i,
          'e-service ID must be alphanumeric, dashes are allowed',
        ],
      },

      webhook: {
        // TODO: URL validation, encrypt mode validation
        url: {
          type: String,
          default: '',
          validate: {
            validator: async (v: string) => !v || validateWebhookUrl(v),
            message:
              'Webhook must be a valid URL over HTTPS and point to a public IP.',
          },
        },
      },

      msgSrvcName: {
        // Name of credentials for messaging service, stored in secrets manager
        type: String,
        required: false,
        match: [
          /^([a-zA-Z0-9-])+$/i,
          'msgSrvcName must be alphanumeric, dashes are allowed',
        ],
      },
    },
    formSchemaOptions,
  )

  // Add discriminators for the various field types.
  const FormFieldPath = FormSchema.path(
    'form_fields',
  ) as Schema.Types.DocumentArray

  const TableFieldSchema = createTableFieldSchema()

  FormFieldPath.discriminator(BasicFieldType.Email, createEmailFieldSchema())
  FormFieldPath.discriminator(BasicFieldType.Rating, createRatingFieldSchema())
  FormFieldPath.discriminator(
    BasicFieldType.Attachment,
    createAttachmentFieldSchema(),
  )
  FormFieldPath.discriminator(
    BasicFieldType.Dropdown,
    createDropdownFieldSchema(),
  )
  FormFieldPath.discriminator(BasicFieldType.Radio, createRadioFieldSchema())
  FormFieldPath.discriminator(
    BasicFieldType.Checkbox,
    createCheckboxFieldSchema(),
  )
  FormFieldPath.discriminator(
    BasicFieldType.ShortText,
    createShortTextFieldSchema(),
  )
  FormFieldPath.discriminator(BasicFieldType.HomeNo, createHomenoFieldSchema())
  FormFieldPath.discriminator(BasicFieldType.Mobile, createMobileFieldSchema())
  FormFieldPath.discriminator(
    BasicFieldType.LongText,
    createLongTextFieldSchema(),
  )
  FormFieldPath.discriminator(BasicFieldType.Number, createNumberFieldSchema())
  FormFieldPath.discriminator(
    BasicFieldType.Decimal,
    createDecimalFieldSchema(),
  )
  FormFieldPath.discriminator(BasicFieldType.Image, createImageFieldSchema())
  FormFieldPath.discriminator(BasicFieldType.Date, createDateFieldSchema())
  FormFieldPath.discriminator(BasicFieldType.Nric, createNricFieldSchema())
  FormFieldPath.discriminator(BasicFieldType.YesNo, createYesNoFieldSchema())
  FormFieldPath.discriminator(
    BasicFieldType.Statement,
    createStatementFieldSchema(),
  )
  FormFieldPath.discriminator(
    BasicFieldType.Section,
    createSectionFieldSchema(),
  )
  FormFieldPath.discriminator(BasicFieldType.Table, TableFieldSchema)
  const TableColumnPath = TableFieldSchema.path(
    'columns',
  ) as Schema.Types.DocumentArray
  TableColumnPath.discriminator(
    BasicFieldType.ShortText,
    createShortTextFieldSchema(),
  )
  TableColumnPath.discriminator(
    BasicFieldType.Dropdown,
    createDropdownFieldSchema(),
  )

  // Discriminator defines all possible values of startPage.logo
  const StartPageLogoPath = FormSchema.path(
    'startPage.logo',
  ) as Schema.Types.DocumentArray
  StartPageLogoPath.discriminator(FormLogoState.Custom, CustomFormLogoSchema)

  // Discriminator defines different logic types
  const FormLogicPath = FormSchema.path(
    'form_logics',
  ) as Schema.Types.DocumentArray

  FormLogicPath.discriminator(LogicType.ShowFields, ShowFieldsLogicSchema)
  FormLogicPath.discriminator(LogicType.PreventSubmit, PreventSubmitLogicSchema)

  // Methods
  FormSchema.methods.getMainFields = function (this: IFormSchema) {
    let form = {
      _id: this._id,
      title: this.title,
      status: this.status,
    }
    return form
  }

  // Method to return myInfo attributes
  FormSchema.methods.getUniqMyinfoAttrs = function (this: IFormSchema) {
    if (this.authType !== AuthType.SP) {
      return []
    }

    // Compact is used to remove undefined from array
    return compact(uniq(this.form_fields.map((field) => field.myInfo?.attr)))
  }

  // Return a duplicate form object with the given properties
  FormSchema.methods.duplicate = function (
    this: IFormSchema,
    overrideProps: object,
  ) {
    const newForm = pick(this, FORM_DUPLICATE_KEYS)
    Object.assign(newForm, overrideProps)
    return newForm
  }

  // Statics
  // Method to retrieve data for OTP verification
  FormSchema.statics.getOtpData = async function (
    this: IFormModel,
    formId: string,
  ) {
    try {
      const data = await this.findById(formId, 'msgSrvcName admin').populate({
        path: 'admin',
        select: 'email',
      })
      const otpData: OtpData = {
        form: data._id,
        formAdmin: {
          email: data.admin.email,
          userId: data.admin._id,
        },
        msgSrvcName: data.msgSrvcName,
      }
      return otpData
    } catch {
      return null
    }
  }

  // Returns the form with populated admin details
  FormSchema.statics.getFullFormById = async function (
    this: IFormModel,
    formId: string,
  ): Promise<IPopulatedForm> {
    const data: IPopulatedForm = await this.findById(formId).populate({
      path: 'admin',
      populate: {
        path: 'agency',
      },
    })
    return data
  }

  // Hooks
  FormSchema.pre<IFormSchema>('validate', function (next) {
    // Reject save if form document is too large
    if (bson.calculateObjectSize(this) > 10 * MB) {
      const err = new Error('Form size exceeded.')
      err.name = 'FormSizeError'
      return next(err)
    }

    // Validate that admin exists before form is created.
    User.findById(this.admin, function (error, admin) {
      if (error) {
        return next(Error(`Error validating admin for form.`))
      }
      if (!admin) {
        return next(Error(`Admin for this form is not found.`))
      }
      return next()
    })
  })

  // Indexes
  // Provide an index to allow text search for form examples
  FormSchema.index({
    'startPage.paragraph': 'text',
    title: 'text',
  })

  FormSchema.index({
    'permissionList.email': 1,
    lastModified: -1,
  })

  FormSchema.index({
    admin: 1,
    lastModified: -1,
  })

  const FormModel = db.model<IFormSchema, IFormModel>(
    FORM_SCHEMA_ID,
    FormSchema,
  )

  // Adding form discriminators
  FormModel.discriminator(ResponseMode.Email, EmailFormSchema)
  FormModel.discriminator(ResponseMode.Encrypt, EncryptedFormSchema)

  return FormModel
}

const compileEmailFormModel = (db: Mongoose) => {
  return db.model<IEmailFormSchema, IEmailFormModel>(
    ResponseMode.Email,
    EmailFormSchema,
  )
}

export const getEmailFormModel = (db: Mongoose) => {
  try {
    return db.model(ResponseMode.Email) as IEmailFormModel
  } catch {
    return compileEmailFormModel(db)
  }
}

const compileEncryptedFormModel = (db: Mongoose) => {
  return db.model<IEncryptedFormSchema, IEncryptedFormModel>(
    ResponseMode.Encrypt,
    EncryptedFormSchema,
  )
}

export const getEncryptedFormModel = (db: Mongoose) => {
  try {
    return db.model(ResponseMode.Encrypt) as IEncryptedFormModel
  } catch {
    return compileEncryptedFormModel(db)
  }
}

const getFormModel = (db: Mongoose) => {
  try {
    return db.model(FORM_SCHEMA_ID) as IFormModel
  } catch {
    return compileFormModel(db)
  }
}

export default getFormModel
