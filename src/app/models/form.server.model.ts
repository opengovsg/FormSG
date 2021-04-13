import BSON from 'bson-ext'
import { compact, pick, uniq } from 'lodash'
import mongoose, { Mongoose, Query, Schema, SchemaOptions } from 'mongoose'
import validator from 'validator'

import {
  AuthType,
  BasicField,
  Colors,
  FormLogoState,
  FormMetaView,
  FormOtpData,
  FormSettings,
  IEmailFormModel,
  IEmailFormSchema,
  IEncryptedFormModel,
  IEncryptedFormSchema,
  IFormDocument,
  IFormModel,
  IFormSchema,
  IPopulatedForm,
  LogicType,
  Permission,
  PickDuplicateForm,
  PublicForm,
  PublicFormValues,
  ResponseMode,
  Status,
} from '../../types'
import { IPopulatedUser, IUserSchema } from '../../types/user'
import { MB } from '../constants/filesize'
import { OverrideProps } from '../modules/form/admin-form/admin-form.types'
import { transformEmails } from '../modules/form/form.utils'
import { validateWebhookUrl } from '../modules/webhook/webhook.validation'

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

// Exported for testing.
export const FORM_PUBLIC_FIELDS: (keyof PublicFormValues)[] = [
  'admin',
  'authType',
  'endPage',
  'esrvcId',
  'form_fields',
  'form_logics',
  'hasCaptcha',
  'publicKey',
  'startPage',
  'status',
  'title',
  '_id',
  'responseMode',
]

export const FORM_SETTING_FIELDS: (keyof FormSettings)[] = [
  'authType',
  'emails',
  'esrvcId',
  'hasCaptcha',
  'inactiveMessage',
  'status',
  'submissionLimit',
  'title',
  'webhook',
]

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

const EncryptedFormSchema = new Schema<IEncryptedFormSchema>({
  publicKey: {
    type: String,
    required: true,
  },
})

const EmailFormSchema = new Schema<IEmailFormSchema, IEmailFormModel>({
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
        if (v.length === 0) return false
        return v.every((email) => validator.isEmail(email))
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
  const FormSchema = new Schema<IFormSchema, IFormModel>(
    {
      title: {
        type: String,
        validate: [
          /^[a-zA-Z0-9_\-./() &`;'"]*$/,
          'Form name cannot contain special characters',
        ],
        required: 'Form name cannot be blank',
        minlength: [4, 'Form name must be at least 4 characters'],
        maxlength: [200, 'Form name can have a maximum of 200 characters'],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        trim: true,
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
          // TODO (#1222): Convert to validator
          // Do not allow authType to be changed if form is published
          if (this.authType !== v && this.status === Status.Public) {
            return this.authType
          } else if (
            this.responseMode === ResponseMode.Encrypt &&
            v === AuthType.MyInfo
          ) {
            // Do not allow storage mode to have MyInfo authentication
            return this.authType
          } else {
            return v
          }
        },
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
        validate: [
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
      },

      submissionLimit: {
        type: Number,
        default: null,
        min: 1,
      },
    },
    formSchemaOptions,
  )

  // Add discriminators for the various field types.
  const FormFieldPath = FormSchema.path(
    'form_fields',
  ) as Schema.Types.DocumentArrayWithLooseDiscriminator

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
  ) as Schema.Types.DocumentArrayWithLooseDiscriminator
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
  ) as Schema.Types.DocumentArrayWithLooseDiscriminator
  StartPageLogoPath.discriminator(FormLogoState.Custom, CustomFormLogoSchema)

  // Discriminator defines different logic types
  const FormLogicPath = FormSchema.path(
    'form_logics',
  ) as Schema.Types.DocumentArrayWithLooseDiscriminator

  FormLogicPath.discriminator(LogicType.ShowFields, ShowFieldsLogicSchema)
  FormLogicPath.discriminator(LogicType.PreventSubmit, PreventSubmitLogicSchema)

  // Methods
  FormSchema.methods.getDashboardView = function (
    this: IFormSchema,
    admin: IPopulatedUser,
  ) {
    return {
      _id: this._id,
      title: this.title,
      status: this.status,
      lastModified: this.lastModified,
      responseMode: this.responseMode,
      admin,
    }
  }

  // Method to return myInfo attributes
  FormSchema.methods.getUniqueMyInfoAttrs = function (this: IFormSchema) {
    if (this.authType !== AuthType.MyInfo) {
      return []
    }

    // Compact is used to remove undefined from array
    return compact(uniq(this.form_fields?.map((field) => field.myInfo?.attr)))
  }

  // Return essential form creation parameters with the given properties
  FormSchema.methods.getDuplicateParams = function (
    this: IFormSchema,
    overrideProps: OverrideProps,
  ) {
    const newForm = pick(this, [
      'form_fields',
      'form_logics',
      'startPage',
      'endPage',
      'authType',
      'inactiveMessage',
      'responseMode',
      'submissionLimit',
    ]) as PickDuplicateForm
    return { ...newForm, ...overrideProps }
  }

  FormSchema.methods.pick = function (
    this: IFormSchema,
    fields: (keyof IFormSchema)[],
  ) {
    return pick(this, fields)
  }

  FormSchema.methods.getPublicView = function (this: IFormSchema): PublicForm {
    const basePublicView = pick(this, FORM_PUBLIC_FIELDS) as PublicFormValues

    // Return non-populated public fields of form if not populated.
    if (!this.populated('admin')) {
      return basePublicView
    }

    // Populated, return public view with user's public view.
    return {
      ...basePublicView,
      admin: (this.admin as IUserSchema).getPublicView(),
    }
  }

  // Archives form.
  FormSchema.methods.archive = function (this: IFormSchema) {
    // Return instantly when form is already archived.
    if (this.status === Status.Archived) {
      return Promise.resolve(this)
    }

    this.status = Status.Archived
    return this.save()
  }

  const FormDocumentSchema = (FormSchema as unknown) as Schema<IFormDocument>

  FormDocumentSchema.methods.getSettings = function (
    this: IFormDocument,
  ): FormSettings {
    return pick(this, FORM_SETTING_FIELDS)
  }

  // Transfer ownership of the form to another user
  FormDocumentSchema.methods.transferOwner = async function (
    this: IFormDocument,
    currentOwner: IUserSchema,
    newOwner: IUserSchema,
  ) {
    // Update form's admin to new owner's id.
    this.admin = newOwner._id

    // Remove new owner from perm list and include previous owner as an editor.
    this.permissionList = this.permissionList.filter(
      (item) => item.email !== newOwner.email,
    )
    this.permissionList.push({ email: currentOwner.email, write: true })

    return this.save()
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
    fields?: (keyof IPopulatedForm)[],
  ): Promise<IPopulatedForm | null> {
    return this.findById(formId, fields).populate({
      path: 'admin',
      populate: {
        path: 'agency',
      },
    }) as Query<IPopulatedForm, IFormDocument>
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

  FormSchema.statics.getMetaByUserIdOrEmail = async function (
    this: IFormModel,
    userId: IUserSchema['_id'],
    userEmail: IUserSchema['email'],
  ): Promise<FormMetaView[]> {
    return (
      this.find()
        // List forms when either the user is an admin or collaborator.
        .or([{ 'permissionList.email': userEmail }, { admin: userId }])
        // Filter out archived forms.
        .where('status')
        .ne(Status.Archived)
        // Project selected fields.
        // `responseMode` is a discriminator key and is returned regardless,
        // selection is made for explicitness.
        // `_id` is also returned regardless and selection is made for
        // explicitness.
        .select('_id title admin lastModified status responseMode')
        .sort('-lastModified')
        .populate({
          path: 'admin',
          populate: {
            path: 'agency',
          },
        })
        .lean()
        .exec()
    )
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
    return User.findById(this.admin).then((admin) => {
      if (!admin) {
        const validationError = this.invalidate(
          'admin',
          'Admin for this form is not found.',
        ) as mongoose.Error.ValidationError
        return next(validationError)
      }

      // Remove admin from the permission list if they exist.
      // This prevents the form owner from being both an admin and another role.
      this.permissionList = this.permissionList?.filter(
        (item) => item.email !== admin.email,
      )

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
