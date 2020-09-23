import BSON from 'bson-ext'
import { compact, filter, pick, uniq } from 'lodash'
import { Model, Mongoose, Schema, SchemaOptions } from 'mongoose'
import validator from 'validator'

import { FORM_DUPLICATE_KEYS } from '../../shared/constants'
import {
  AuthType,
  BasicField,
  Colors,
  FormLogoState,
  FormOtpData,
  IEmailFormSchema,
  IEncryptedFormSchema,
  IForm,
  IFormSchema,
  IPopulatedForm,
  LogicType,
  Permission,
  ResponseMode,
  Status,
} from '../../types'
import { IUserSchema } from '../../types/user'
import { MB } from '../constants/filesize'
import { validateWebhookUrl } from '../modules/webhook/webhook.utils'

import getAgencyModel from './agency.server.model'
import {
  BaseFieldSchema,
  createAttachmentFieldSchema,
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
  getOtpData(formId: string): Promise<FormOtpData | null>
  getFullFormById(formId: string): Promise<IPopulatedForm | null>
  deactivateById(formId: string): Promise<IFormSchema | null>
}

type IEncryptedFormModel = Model<IEncryptedFormSchema> & IFormModel

const EncryptedFormSchema = new Schema<IEncryptedFormSchema>({
  publicKey: {
    type: String,
    required: true,
  },
})

type IEmailFormModel = Model<IEmailFormSchema> & IFormModel

// Function that coerces the string of comma-separated emails sent by the client
// into an array of emails
function transformEmails(v: string | string[]): string[] {
  // Cases
  // ['test@hotmail.com'] => ['test@hotmail.com'] ~ unchanged
  // ['test@hotmail.com', 'test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com'] ~ unchanged
  // ['test@hotmail.com, test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com']
  // ['test@hotmail.com, test@gmail.com', 'test@yahoo.com'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
  // 'test@hotmail.com, test@gmail.com' => ['test@hotmail.com', 'test@gmail.com']
  if (Array.isArray(v)) {
    return v
      .join(',')
      .replace(/;/g, ',')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((email) => email.includes('@')) // remove ""
  } else {
    return v.split(',').map((email) => email.trim())
  }
}

const EmailFormSchema = new Schema<IEmailFormSchema>({
  emails: {
    type: [
      {
        type: String,
        trim: true,
      },
    ],
    set: transformEmails,
    validate: {
      validator: (v: string[]) => {
        if (!Array.isArray(v)) return false
        return v.every((email) => validator.isEmail(email.trim()))
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
          /^[a-zA-Z0-9_\-./() &`;'"]*$/,
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

  FormFieldPath.discriminator(BasicField.Email, createEmailFieldSchema())
  FormFieldPath.discriminator(BasicField.Rating, createRatingFieldSchema())
  FormFieldPath.discriminator(
    BasicField.Attachment,
    createAttachmentFieldSchema(),
  )
  FormFieldPath.discriminator(BasicField.Dropdown, createDropdownFieldSchema())
  FormFieldPath.discriminator(BasicField.Radio, createRadioFieldSchema())
  FormFieldPath.discriminator(BasicField.Checkbox, createCheckboxFieldSchema())
  FormFieldPath.discriminator(
    BasicField.ShortText,
    createShortTextFieldSchema(),
  )
  FormFieldPath.discriminator(BasicField.HomeNo, createHomenoFieldSchema())
  FormFieldPath.discriminator(BasicField.Mobile, createMobileFieldSchema())
  FormFieldPath.discriminator(BasicField.LongText, createLongTextFieldSchema())
  FormFieldPath.discriminator(BasicField.Number, createNumberFieldSchema())
  FormFieldPath.discriminator(BasicField.Decimal, createDecimalFieldSchema())
  FormFieldPath.discriminator(BasicField.Image, createImageFieldSchema())
  FormFieldPath.discriminator(BasicField.Date, createDateFieldSchema())
  FormFieldPath.discriminator(BasicField.Nric, createNricFieldSchema())
  FormFieldPath.discriminator(BasicField.YesNo, createYesNoFieldSchema())
  FormFieldPath.discriminator(
    BasicField.Statement,
    createStatementFieldSchema(),
  )
  FormFieldPath.discriminator(BasicField.Section, createSectionFieldSchema())
  FormFieldPath.discriminator(BasicField.Table, TableFieldSchema)
  const TableColumnPath = TableFieldSchema.path(
    'columns',
  ) as Schema.Types.DocumentArray
  TableColumnPath.discriminator(
    BasicField.ShortText,
    createShortTextFieldSchema(),
  )
  TableColumnPath.discriminator(
    BasicField.Dropdown,
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
    const form = {
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
    return compact(uniq(this.form_fields?.map((field) => field.myInfo?.attr)))
  }

  // Return a duplicate form object with the given properties
  FormSchema.methods.duplicate = function (
    this: IFormSchema,
    overrideProps: Partial<IForm>,
  ) {
    const newForm = pick(this, FORM_DUPLICATE_KEYS)
    Object.assign(newForm, overrideProps)
    return newForm
  }

  // Transfer ownership of the form to another user
  FormSchema.methods.transferOwner = async function (
    currentOwner: IUserSchema,
    newOwnerEmail: string,
  ) {
    // Verify that the new owner exists
    const newOwner = await User.findOne({ email: newOwnerEmail })
    if (newOwner == null) {
      throw new Error(
        `${newOwnerEmail} must have logged in once before being added as Owner`,
      )
    }

    // Update form's admin to new owner's id
    this.admin = newOwner._id

    // Remove new owner from perm list and include previous owner as an editor
    this.permissionList = filter(this.permissionList, (item) => {
      return item.email !== newOwnerEmail
    })
    this.permissionList.push({ email: currentOwner.email, write: true })
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
      return data
        ? ({
            form: data._id,
            formAdmin: {
              email: data.admin.email,
              userId: data.admin._id,
            },
            msgSrvcName: data.msgSrvcName,
          } as FormOtpData)
        : null
    } catch {
      return null
    }
  }

  // Returns the form with populated admin details
  FormSchema.statics.getFullFormById = async function (
    this: IFormModel,
    formId: string,
  ): Promise<IPopulatedForm | null> {
    const data: IPopulatedForm | null = await this.findById(formId).populate({
      path: 'admin',
      populate: {
        path: 'agency',
      },
    })
    return data
  }

  // Deactivate form by ID
  FormSchema.statics.deactivateById = async function (
    this: IFormModel,
    formId: string,
  ): Promise<IFormSchema | null> {
    const form = await this.findById(formId)
    if (!form) return null
    if (form.status === Status.Public) {
      form.status = Status.Private
    }
    return form.save()
  }

  // Hooks
  FormSchema.pre<IFormSchema>('validate', async function (next) {
    // Reject save if form document is too large
    if (bson.calculateObjectSize(this) > 10 * MB) {
      const err = new Error('Form size exceeded.')
      err.name = 'FormSizeError'
      return next(err)
    }

    // Validate that admin exists before form is created.
    await User.findById(this.admin, function (error, admin) {
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

const getFormModel = (db: Mongoose): IFormModel => {
  try {
    return db.model(FORM_SCHEMA_ID) as IFormModel
  } catch {
    return compileFormModel(db)
  }
}

export const getEmailFormModel = (db: Mongoose): IEmailFormModel => {
  // Load or build base model first
  getFormModel(db)
  return db.model(ResponseMode.Email) as IEmailFormModel
}

export const getEncryptedFormModel = (db: Mongoose): IEncryptedFormModel => {
  // Load or build base model first
  getFormModel(db)
  return db.model(ResponseMode.Encrypt) as IEncryptedFormModel
}

export default getFormModel
