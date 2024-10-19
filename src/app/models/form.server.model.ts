import { calculateObjectSize, ObjectId } from 'bson'
import { compact, omit, pick, uniq } from 'lodash'
import mongoose, {
  ClientSession,
  Mongoose,
  Query,
  Schema,
  SchemaOptions,
  Types,
} from 'mongoose'
import validator from 'validator'
import isEmail from 'validator/lib/isEmail'

import {
  ADMIN_FORM_META_FIELDS,
  EMAIL_FORM_SETTINGS_FIELDS,
  EMAIL_PUBLIC_FORM_FIELDS,
  MB,
  MULTIRESPONDENT_FORM_SETTINGS_FIELDS,
  MULTIRESPONDENT_PUBLIC_FORM_FIELDS,
  STORAGE_FORM_SETTINGS_FIELDS,
  STORAGE_PUBLIC_FORM_FIELDS,
  WEBHOOK_SETTINGS_FIELDS,
} from '../../../shared/constants'
import {
  AdminDashboardFormMetaDto,
  BasicField,
  EmailFormSettings,
  FormAuthType,
  FormColorTheme,
  FormEndPage,
  FormField,
  FormFieldDto,
  FormLogoState,
  FormPaymentsChannel,
  FormPaymentsField,
  FormPermission,
  FormResponseMode,
  FormSettings,
  FormStartPage,
  FormStatus,
  FormWebhookResponseModeSettings,
  FormWebhookSettings,
  LogicConditionState,
  LogicDto,
  LogicType,
  MultirespondentFormSettings,
  PaymentChannel,
  PaymentType,
  StorageFormSettings,
  WorkflowType,
} from '../../../shared/types'
import { reorder } from '../../../shared/utils/immutable-array-fns'
import { getApplicableIfStates } from '../../../shared/utils/logic'
import {
  FormFieldSchema,
  FormLogicSchema,
  FormOtpData,
  IEmailFormModel,
  IEmailFormSchema,
  IEncryptedFormDocument,
  IEncryptedFormModel,
  IEncryptedFormSchema,
  IFieldSchema,
  IFormDocument,
  IFormModel,
  IFormSchema,
  ILogicSchema,
  IMultirespondentFormModel,
  IMultirespondentFormSchema,
  IPopulatedForm,
  PickDuplicateForm,
  PublicForm,
} from '../../types'
import { IPopulatedUser, IUserSchema } from '../../types/user'
import { OverrideProps } from '../modules/form/admin-form/admin-form.types'
import { getFormFieldById, transformEmails } from '../modules/form/form.utils'
import { getMyInfoAttr } from '../modules/myinfo/myinfo.util'
import { validateWebhookUrl } from '../modules/webhook/webhook.validation'

import { ProductSchema } from './payments/productSchema'
import {
  BaseFieldSchema,
  createAttachmentFieldSchema,
  createCheckboxFieldSchema,
  createchildrenCompoundFieldSchema,
  createCountryRegionFieldSchema,
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
  createUenFieldSchema,
  createYesNoFieldSchema,
} from './field'
import LogicSchema, {
  PreventSubmitLogicSchema,
  ShowFieldsLogicSchema,
} from './form_logic.server.schema'
import { CustomFormLogoSchema, FormLogoSchema } from './form_logo.server.schema'
import { FORM_WHITELISTED_SUBMITTER_IDS_ID } from './form_whitelist.server.model'
import WorkflowStepSchema, {
  WorkflowStepDynamicSchema,
  WorkflowStepStaticSchema,
} from './form_workflow_step.server.schema'
import getUserModel from './user.server.model'
import { isPositiveInteger } from './utils'

export const FORM_SCHEMA_ID = 'Form'

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

export const formPaymentsFieldSchema = {
  enabled: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  amount_cents: {
    type: Number,
    default: 0,
    validate: {
      validator: isPositiveInteger,
      message: 'amount_cents must be a non-negative integer.',
    },
  },
  products: [ProductSchema],
  products_meta: {
    multi_product: {
      type: Boolean,
      default: false,
    },
  },
  min_amount: {
    type: Number,
    default: 0,
    validate: {
      validator: isPositiveInteger,
      message: 'min_amount must be a non-negative integer.',
    },
  },
  max_amount: {
    type: Number,
    default: 0,
    validate: {
      validator: isPositiveInteger,
      message: 'max_amount must be a non-negative integer.',
    },
  },
  payment_type: {
    type: String,
    enum: Object.values(PaymentType),
    default: PaymentType.Products,
  },
  gst_enabled: {
    type: Boolean,
    default: true,
  },
  global_min_amount_override: {
    type: Number,
    default: 0,
  },
}

const whitelistedSubmitterIdNestedPath = {
  isWhitelistEnabled: {
    type: Boolean,
    required: true,
    default: false,
  },
  encryptedWhitelistedSubmitterIds: {
    type: Schema.Types.ObjectId,
    ref: FORM_WHITELISTED_SUBMITTER_IDS_ID,
    required: false,
    default: undefined,
  },
  _id: { id: false },
}

const EncryptedFormSchema = new Schema<IEncryptedFormSchema>({
  publicKey: {
    type: String,
    required: true,
  },
  emails: {
    type: [
      {
        type: String,
        trim: true,
      },
    ],
    set: transformEmails,
    validate: [
      (v: string[]) => {
        if (!Array.isArray(v)) return false
        if (v.length === 0) return true
        return v.every((email) => validator.isEmail(email))
      },
      'Please provide valid email addresses',
    ],
    // Mongoose v6 only checks if the type is an array, not whether the array
    // is non-empty. We allow this field to not exist for backwards compatibility
    // TODO: Make this required after all forms have been migrated
    required: false,
  },
  whitelistedSubmitterIds: {
    type: whitelistedSubmitterIdNestedPath,
    get: (v: { isWhitelistEnabled: boolean }) => ({
      // remove the ObjectId link to whitelist collection's document by default unless asked for.
      isWhitelistEnabled: v.isWhitelistEnabled,
    }),
    default: () => ({
      isWhitelistEnabled: false,
    }),
  },
  payments_channel: {
    channel: {
      type: String,
      enum: Object.values(PaymentChannel),
      default: PaymentChannel.Unconnected,
    },
    target_account_id: {
      type: String,
      default: '',
      validate: [/^\S*$/i, 'target_account_id must not contain whitespace.'],
    },
    publishable_key: {
      type: String,
      default: '',
      validate: [/^\S*$/i, 'publishable_key must not contain whitespace.'],
    },
    payment_methods: {
      type: [String],
      default: [],
    },
  },

  payments_field: formPaymentsFieldSchema,

  business: {
    type: {
      address: { type: String, default: '', trim: true },
      gstRegNo: { type: String, default: '', trim: true },
    },
  },
})

const EncryptedFormDocumentSchema =
  EncryptedFormSchema as unknown as Schema<IEncryptedFormDocument>

EncryptedFormDocumentSchema.methods.getWhitelistedSubmitterIds = function () {
  return this.get('whitelistedSubmitterIds', null, {
    getters: false,
  })
}

EncryptedFormDocumentSchema.methods.addPaymentAccountId = function ({
  accountId,
  publishableKey,
}: {
  accountId: FormPaymentsChannel['target_account_id']
  publishableKey: FormPaymentsChannel['publishable_key']
}) {
  if (this.payments_channel?.channel === PaymentChannel.Unconnected) {
    this.payments_channel = {
      // Definitely Stripe for now, may be different later on.
      channel: PaymentChannel.Stripe,
      target_account_id: accountId,
      publishable_key: publishableKey,
      payment_methods: [],
    }
  }
  return this.save()
}

EncryptedFormDocumentSchema.methods.removePaymentAccount = async function () {
  this.payments_channel = {
    channel: PaymentChannel.Unconnected,
    target_account_id: '',
    publishable_key: '',
    payment_methods: [],
  }
  if (this.payments_field) {
    this.payments_field.enabled = false
  }
  return this.save()
}

const EmailFormSchema = new Schema<IEmailFormSchema, IEmailFormModel>({
  emails: {
    type: [
      {
        type: String,
        trim: true,
      },
    ],
    set: transformEmails,
    validate: [
      (v: string[]) => {
        if (!Array.isArray(v)) return false
        if (v.length === 0) return false
        return v.every((email) => validator.isEmail(email))
      },
      'Please provide valid email addresses',
    ],
    // Mongoose v5 only checks if the type is an array, not whether the array
    // is non-empty.
    required: [true, 'Emails field is required'],
  },
})

const MultirespondentFormSchema = new Schema<IMultirespondentFormSchema>({
  publicKey: {
    type: String,
    required: true,
  },
  workflow: {
    type: [WorkflowStepSchema],
  },
  emails: {
    type: [
      {
        type: String,
        trim: true,
      },
    ],
    set: transformEmails,
    validate: [
      (v: string[]) => {
        if (!Array.isArray(v)) return false
        if (v.length === 0) return true
        return v.every((email) => validator.isEmail(email))
      },
      'Please provide valid email addresses',
    ],
    required: true,
  },
  stepsToNotify: {
    type: [{ type: String }],
    validate: [
      {
        validator: (v: string[]) => {
          if (!Array.isArray(v)) return false
          if (v.length === 0) return true
          return v.every((fieldId) => ObjectId.isValid(fieldId))
        },
        message: 'Please provide valid form field ids',
      },
    ],
    required: true,
  },
  stepOneEmailNotificationFieldId: {
    type: String,
    default: '',
  },
})

const MultirespondentFormWorkflowPath = MultirespondentFormSchema.path(
  'workflow',
) as Schema.Types.DocumentArray

MultirespondentFormWorkflowPath.discriminator(
  WorkflowType.Static,
  WorkflowStepStaticSchema,
)
MultirespondentFormWorkflowPath.discriminator(
  WorkflowType.Dynamic,
  WorkflowStepDynamicSchema,
)

const compileFormModel = (db: Mongoose): IFormModel => {
  const User = getUserModel(db)

  // Schema
  const FormSchema = new Schema<IFormSchema, IFormModel>(
    {
      title: {
        type: String,
        required: [true, 'Form name cannot be blank'],
        minlength: [4, 'Form name must be at least 4 characters'],
        maxlength: [200, 'Form name can have a maximum of 200 characters'],
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        trim: true,
      },

      form_fields: {
        type: [BaseFieldSchema],
        validate: {
          validator: function (this: IFormSchema) {
            const myInfoFieldCount = (this.form_fields ?? []).reduce(
              (acc, field) => acc + (field.myInfo ? 1 : 0),
              0,
            )
            return (
              myInfoFieldCount === 0 ||
              ((this.authType === FormAuthType.MyInfo ||
                this.authType === FormAuthType.SGID_MyInfo) &&
                myInfoFieldCount <= 30)
            )
          },
          message:
            'Check that your form is MyInfo-authenticated and has 30 or fewer MyInfo fields.',
        },
      },
      form_logics: {
        type: [LogicSchema],
        validate: {
          validator(this: IFormSchema, v: ILogicSchema[]) {
            /**
             * A validatable condition is incomplete if there is a possibility
             * that its fieldType is null, which is a sign that a condition's
             * field property references a non-existent form_field.
             */
            type IncompleteValidatableCondition = {
              state: LogicConditionState
              fieldType?: BasicField
            }

            /**
             * A condition object is said to be validatable if it contains the two
             * necessary for validation: fieldType and state
             */
            type ValidatableCondition = IncompleteValidatableCondition & {
              fieldType: BasicField
            }

            const isConditionReferencesExistingField = (
              condition: IncompleteValidatableCondition,
            ): condition is ValidatableCondition => !!condition.fieldType

            const conditions = v.flatMap((logic) => {
              return logic.conditions.map<IncompleteValidatableCondition>(
                (condition) => {
                  const {
                    field,
                    state,
                  }: { field: ObjectId | string; state: LogicConditionState } =
                    condition
                  return {
                    state,
                    fieldType: this.form_fields?.find(
                      (f: IFieldSchema) => String(f._id) === String(field),
                    )?.fieldType,
                  }
                },
              )
            })

            return conditions.every((condition) => {
              /**
               * Form fields can get deleted by form admins, which causes logic
               * conditions to reference invalid fields. Here we bypass validation
               * and allow these conditions to be saved, so we don't make life
               * difficult for form admins.
               */
              if (!isConditionReferencesExistingField(condition)) return true

              const { fieldType, state } = condition
              const applicableIfStates = getApplicableIfStates(fieldType)
              return applicableIfStates.includes(state)
            })
          },
          message: 'Form logic condition validation failed.',
        },
      },

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
              // Set email to lowercase for consistency
              set: (v: string) => v.toLowerCase(),
            },
            write: {
              type: Boolean,
              default: false,
            },
          },
        ],
        validate: {
          validator: (users: FormPermission[]) =>
            users.every((user) => !!user.email && isEmail(user.email)),
          message: 'Failed to update collaborators list.',
        },
      },

      startPage: {
        paragraph: String,
        estTimeTaken: Number,
        colorTheme: {
          type: String,
          enum: Object.values(FormColorTheme),
          default: FormColorTheme.Blue,
        },
        logo: {
          type: FormLogoSchema,
          default: () => ({}),
        },
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
          default: 'Submit another response',
        },
        paymentTitle: {
          type: String,
          default: 'Thank you, your payment has been made successfully.',
        },
        paymentParagraph: {
          type: String,
          default: 'Your form has been submitted and payment has been made.',
        },
      },

      hasCaptcha: {
        type: Boolean,
        default: true,
      },

      hasIssueNotification: {
        type: Boolean,
        default: true,
      },

      authType: {
        type: String,
        enum: Object.values(FormAuthType),
        default: FormAuthType.NIL,
        set: function (this: IFormSchema, v: FormAuthType) {
          // TODO (#1222): Convert to validator
          // Do not allow authType to be changed if form is published
          if (this.authType !== v && this.status === FormStatus.Public) {
            return this.authType
          } else {
            return v
          }
        },
      },

      isSubmitterIdCollectionEnabled: {
        type: Boolean,
        default: false,
      },

      isSingleSubmission: {
        type: Boolean,
        default: false,
      },

      // This must be before `status` since `status` has setters reliant on
      // whether esrvcId is available, and mongoose@v6 now saves objects with keys
      // in the order the keys are specifified in the schema instead of the object.
      // See https://mongoosejs.com/docs/migrating_to_6.html#schema-defined-document-key-order.
      esrvcId: {
        type: String,
        required: false,
        validate: [/^\S*$/i, 'e-service ID must not contain whitespace'],
      },

      status: {
        type: String,
        enum: Object.values(FormStatus),
        default: FormStatus.Private,
        set: function (this: IFormSchema, v: FormStatus) {
          if (
            this.status === FormStatus.Private &&
            v === FormStatus.Public &&
            this.authType !== FormAuthType.NIL &&
            !this.esrvcId
          ) {
            return FormStatus.Private
          }

          return v
        },
      },

      // The subtext of the message shown on the error page if it is deactivated -
      // the header is "{{ title }} is not available."
      inactiveMessage: {
        type: String,
        default:
          'If you require further assistance, please contact the agency that gave you the form link.',
      },

      isListed: {
        type: Boolean,
        default: true,
      },

      webhook: {
        url: {
          type: String,
          default: '',
          validate: {
            validator: async (v: string) => !v || validateWebhookUrl(v),
            message:
              'Webhook must be a valid URL over HTTPS and point to a public IP.',
          },
        },
        isRetryEnabled: {
          type: Boolean,
          default: false,
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

      goLinkSuffix: {
        // GoGov link suffix
        type: String,
        required: false,
        default: '',
      },

      metadata: {
        type: Object,
        required: false,
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
  FormFieldPath.discriminator(
    BasicField.CountryRegion,
    createCountryRegionFieldSchema(),
  )
  FormFieldPath.discriminator(
    BasicField.Children,
    createchildrenCompoundFieldSchema(),
  )
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
  FormFieldPath.discriminator(BasicField.Uen, createUenFieldSchema())
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

  // Method to return myInfo attributes
  FormSchema.method<IFormSchema>(
    'getUniqueMyInfoAttrs',
    function getUniqueMyInfoAttrs() {
      if (
        this.authType !== FormAuthType.MyInfo &&
        this.authType !== FormAuthType.SGID_MyInfo
      ) {
        return []
      }

      // Compact is used to remove undefined from array
      return compact(
        uniq(
          this.form_fields?.flatMap((field) => {
            return getMyInfoAttr(field)
          }),
        ),
      )
    },
  )

  // Return essential form creation parameters with the given properties
  FormSchema.methods.getDuplicateParams = function (
    overrideProps: OverrideProps,
  ) {
    const newForm = pick(this, [
      'form_fields',
      'form_logics',
      'startPage',
      'endPage',
      'authType',
      'isSubmitterIdCollectionEnabled',
      'isSingleSubmission',
      'inactiveMessage',
      'responseMode',
      'submissionLimit',
    ]) as PickDuplicateForm
    return { ...newForm, ...overrideProps }
  }

  // Archives form.
  FormSchema.methods.archive = function () {
    // Return instantly when form is already archived.
    if (this.status === FormStatus.Archived) {
      return Promise.resolve(this)
    }

    this.status = FormStatus.Archived
    return this.save()
  }

  FormSchema.methods.updateMsgSrvcName = async function (
    msgSrvcName: string,
    session?: ClientSession,
  ) {
    this.msgSrvcName = msgSrvcName

    return this.save({ session })
  }

  FormSchema.methods.deleteMsgSrvcName = async function (
    session?: ClientSession,
  ) {
    this.msgSrvcName = undefined
    return this.save({ session })
  }

  const FormDocumentSchema = FormSchema as unknown as Schema<IFormDocument>

  FormDocumentSchema.methods.getDashboardView = function (
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

  FormDocumentSchema.method<IFormDocument>(
    'getSettings',
    function (): FormSettings {
      switch (this.responseMode) {
        case FormResponseMode.Email:
          return pick(this, EMAIL_FORM_SETTINGS_FIELDS) as EmailFormSettings
        case FormResponseMode.Encrypt:
          return pick(this, STORAGE_FORM_SETTINGS_FIELDS) as StorageFormSettings
        case FormResponseMode.Multirespondent:
          return pick(
            this,
            MULTIRESPONDENT_FORM_SETTINGS_FIELDS,
          ) as MultirespondentFormSettings
      }
    },
  )

  FormDocumentSchema.methods.getWebhookAndResponseModeSettings =
    function (): FormWebhookSettings {
      const formSettings = pick(
        this,
        WEBHOOK_SETTINGS_FIELDS,
      ) as FormWebhookResponseModeSettings
      return formSettings
    }

  FormDocumentSchema.method<IFormDocument>(
    'getPublicView',
    function (): PublicForm {
      let basePublicView
      switch (this.responseMode) {
        case FormResponseMode.Encrypt:
          basePublicView = pick(this, STORAGE_PUBLIC_FORM_FIELDS) as PublicForm
          break
        case FormResponseMode.Email:
          basePublicView = pick(this, EMAIL_PUBLIC_FORM_FIELDS) as PublicForm
          break
        case FormResponseMode.Multirespondent:
          basePublicView = pick(
            this,
            MULTIRESPONDENT_PUBLIC_FORM_FIELDS,
          ) as PublicForm
          break
      }

      // Return non-populated public fields of form if not populated.
      if (!this.populated('admin')) {
        return basePublicView
      }

      // Populated, return public view with user's public view.
      return {
        ...basePublicView,
        admin: (this.admin as IUserSchema).getPublicView(),
      }
    },
  )

  // Transfer ownership of the form to another user
  FormDocumentSchema.method<IFormDocument>(
    'transferOwner',
    async function transferOwner(
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
    },
  )

  // Transfer ownership of multiple forms to another user
  FormSchema.statics.transferAllFormsToNewOwner = async function (
    currentOwner: IUserSchema,
    newOwner: IUserSchema,
  ) {
    return this.updateMany(
      {
        admin: currentOwner._id,
      },
      {
        $set: {
          admin: newOwner._id,
        },
        $addToSet: {
          permissionList: { email: currentOwner.email, write: true },
        },
      },
    ).exec()
  }

  // Add form collaborator
  FormSchema.statics.removeNewOwnerFromPermissionListForAllCurrentOwnerForms =
    async function (currentOwner: IUserSchema, newOwner: IUserSchema) {
      return this.updateMany(
        {
          admin: currentOwner._id,
        },
        {
          $pull: {
            permissionList: {
              email: { $in: [newOwner.email] },
            },
          },
        },
      ).exec()
    }

  FormDocumentSchema.methods.updateFormCollaborators = async function (
    updatedPermissions: FormPermission[],
  ) {
    this.permissionList = updatedPermissions
    return this.save()
  }

  FormDocumentSchema.methods.updateFormFieldById = function (
    fieldId: string,
    newField: FormFieldDto,
  ) {
    const fieldToUpdate = getFormFieldById(this.form_fields, fieldId)
    if (!fieldToUpdate) return Promise.resolve(null)

    if (fieldToUpdate.fieldType !== newField.fieldType) {
      this.invalidate('form_fields', 'Changing form field type is not allowed')
    } else {
      fieldToUpdate.set(newField)
    }

    return this.save()
  }

  FormDocumentSchema.methods.insertFormField = function (
    newField: FormField,
    to?: number,
  ) {
    const formFields = this.form_fields as Types.DocumentArray<IFieldSchema>
    // Must use undefined check since number can be 0; i.e. falsey.
    if (to !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formFields.splice(to, 0, newField as any) // Typings are not complete for splice.
    } else {
      formFields.push(newField)
    }
    return this.save()
  }

  FormDocumentSchema.methods.insertFormFields = function (
    newFields: FormField[],
    to?: number,
  ) {
    const formFields = this.form_fields as Types.DocumentArray<IFieldSchema>
    // Must use undefined check since number can be 0; i.e. falsey.
    if (to !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formFields.splice(to, 0, ...(newFields as any[])) // Typings are not complete for splice.
    } else {
      formFields.push(...newFields)
    }
    return this.save()
  }

  FormDocumentSchema.method<IFormDocument>(
    'duplicateFormFieldByIdAndIndex',
    function (fieldId: string, insertionIndex: number) {
      const fieldToDuplicate = getFormFieldById(this.form_fields, fieldId)
      if (!fieldToDuplicate) return Promise.resolve(null)
      const duplicatedField = omit(fieldToDuplicate, [
        '_id',
        'globalId',
      ]) as FormFieldSchema

      this.form_fields.splice(insertionIndex, 0, duplicatedField)
      return this.save()
    },
  )

  FormDocumentSchema.method<IFormDocument>(
    'reorderFormFieldById',
    function reorderFormFieldById(
      fieldId: string,
      newPosition: number,
    ): Promise<IFormDocument | null> {
      const existingFieldPosition = this.form_fields.findIndex(
        (f) => String(f._id) === fieldId,
      )

      if (existingFieldPosition === -1) return Promise.resolve(null)

      // Exist, reorder form fields and save.
      const updatedFormFields = reorder(
        this.form_fields,
        existingFieldPosition,
        newPosition,
      )
      this.form_fields = updatedFormFields
      return this.save()
    },
  )

  // Statics
  // Method to retrieve data for OTP verification
  FormSchema.statics.getOtpData = async function (formId: string) {
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
    formId: string,
  ): Promise<IFormSchema | null> {
    const form = await this.findById(formId)
    if (!form) return null
    if (form.status === FormStatus.Public) {
      form.status = FormStatus.Private
    }
    return form.save()
  }

  FormDocumentSchema.statics.getMetaByUserIdOrEmail = async function (
    userId: IUserSchema['_id'],
    userEmail: IUserSchema['email'],
  ): Promise<AdminDashboardFormMetaDto[]> {
    return (
      this.find()
        // List forms when either the user is an admin or collaborator.
        .or([
          { 'permissionList.email': userEmail.toLowerCase() },
          { admin: userId },
        ])
        // Filter out archived forms.
        .where('status')
        .ne(FormStatus.Archived)
        // Project selected fields.
        // `responseMode` is a discriminator key and is returned regardless,
        // selection is made for explicitness.
        // `_id` is also returned regardless and selection is made for
        // explicitness.
        .select(ADMIN_FORM_META_FIELDS.join(' '))
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

  // Get all forms owned by the specified user ID.
  FormDocumentSchema.statics.retrieveFormsOwnedByUserId = async function (
    userId: IUserSchema['_id'],
  ): Promise<AdminDashboardFormMetaDto[]> {
    return (
      this.find()
        // List forms when either the user is an admin only.
        .where('admin')
        .eq(userId)
        // Project selected fields.
        // `responseMode` is a discriminator key and is returned regardless,
        // selection is made for explicitness.
        // `_id` is also returned regardless and selection is made for
        // explicitness.
        .select(ADMIN_FORM_META_FIELDS.join(' '))
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

  // Deletes specified form logic.
  FormSchema.statics.deleteFormLogic = async function (
    formId: string,
    logicId: string,
  ): Promise<IFormSchema | null> {
    return this.findByIdAndUpdate(
      formId,
      {
        $pull: { form_logics: { _id: logicId } },
      },
      {
        new: true,
        runValidators: true,
      },
    ).exec()
  }

  // Creates specified form logic.
  FormSchema.statics.createFormLogic = async function (
    formId: string,
    createLogicBody: LogicDto,
  ): Promise<IFormSchema | null> {
    const form = await this.findById(formId).exec()
    if (!form?.form_logics) return null
    const newLogic = (
      form.form_logics as Types.DocumentArray<FormLogicSchema>
    ).create(createLogicBody)
    form.form_logics.push(newLogic)
    return form.save()
  }

  // Deletes specified form field by id.
  FormSchema.statics.deleteFormFieldById = async function (
    formId: string,
    fieldId: string,
  ): Promise<IFormSchema | null> {
    return this.findByIdAndUpdate(
      formId,
      { $pull: { form_fields: { _id: fieldId } } },
      { new: true, runValidators: true },
    ).exec()
  }

  // Updates specified form logic.
  FormSchema.statics.updateFormLogic = async function (
    formId: string,
    logicId: string,
    updatedLogic: LogicDto,
  ): Promise<IFormSchema | null> {
    let form = await this.findById(formId).exec()
    if (!form?.form_logics) return null
    const index = form.form_logics.findIndex(
      (logic) => String(logic._id) === logicId,
    )
    form = form.set(`form_logics.${index}`, updatedLogic, {
      new: true,
    })
    return form.save()
  }

  FormSchema.statics.updateEndPageById = async function (
    formId: string,
    newEndPage: FormEndPage,
  ) {
    return this.findByIdAndUpdate(
      formId,
      { endPage: newEndPage },
      { new: true, runValidators: true },
    ).exec()
  }

  FormSchema.statics.updateStartPageById = async function (
    formId: string,
    newStartPage: FormStartPage,
  ) {
    return this.findByIdAndUpdate(
      formId,
      { startPage: newStartPage },
      { new: true, runValidators: true },
    ).exec()
  }

  FormSchema.statics.updatePaymentsById = async function (
    formId: string,
    newPayments: FormPaymentsField,
  ) {
    return this.findByIdAndUpdate(
      formId,
      { payments_field: newPayments },
      { new: true, runValidators: true },
    ).exec()
  }

  FormSchema.statics.updatePaymentsProductById = async function (
    formId: string,
    newProducts: FormPaymentsField['products'],
  ) {
    return this.findByIdAndUpdate(
      formId,
      { 'payments_field.products': newProducts },
      { new: true, runValidators: true },
    ).exec()
  }

  /**
   * Retrieves all the public forms for a user which has sms verifications enabled
   * This only retrieves forms that are using FormSG credentials
   * @param userId The userId to retrieve the forms for
   * @returns All public forms that have sms verifications enabled
   */
  FormSchema.statics.retrievePublicFormsWithSmsVerification = async function (
    userId: IUserSchema['_id'],
  ) {
    return this.find({
      admin: userId,
      'form_fields.fieldType': BasicField.Mobile,
      'form_fields.isVerifiable': true,
      status: FormStatus.Public,
      msgSrvcName: {
        $exists: false,
      },
    })
      .read('secondary')
      .exec()
  }
  FormSchema.statics.getGoLinkSuffix = async function (formId: string) {
    return this.findById(formId, 'goLinkSuffix').exec()
  }

  FormSchema.statics.setGoLinkSuffix = async function (
    formId: string,
    linkSuffix: string,
  ) {
    return this.findByIdAndUpdate(
      formId,
      { goLinkSuffix: linkSuffix },
      { new: true, runValidators: true },
    ).exec()
  }

  FormSchema.statics.archiveForms = async function (
    formIds: IFormSchema['_id'][],
    session?: ClientSession,
  ) {
    return await this.updateMany(
      { _id: { $in: formIds } },
      { status: FormStatus.Archived },
      { session },
    ).read('primary')
  }

  // Hooks
  FormSchema.pre<IFormSchema>('validate', function (next) {
    // Reject save if form document is too large
    if (calculateObjectSize(this) > 10 * MB) {
      const err = new Error('Form size exceeded.')
      err.name = 'FormSizeError'
      return next(err)
    }

    // Webhooks only allowed if encrypt mode
    if (
      this.responseMode !== FormResponseMode.Encrypt &&
      (this.webhook?.url?.length ?? 0) > 0
    ) {
      const validationError = this.invalidate(
        'webhook',
        'Webhook only allowed on storage mode form',
      ) as mongoose.Error.ValidationError
      return next(validationError)
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
  FormModel.discriminator(FormResponseMode.Email, EmailFormSchema)
  FormModel.discriminator(FormResponseMode.Encrypt, EncryptedFormSchema)
  FormModel.discriminator(
    FormResponseMode.Multirespondent,
    MultirespondentFormSchema,
  )

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
  return db.model(FormResponseMode.Email) as IEmailFormModel
}

export const getEncryptedFormModel = (db: Mongoose): IEncryptedFormModel => {
  // Load or build base model first
  getFormModel(db)
  return db.model(FormResponseMode.Encrypt) as IEncryptedFormModel
}

export const getMultirespondentFormModel = (
  db: Mongoose,
): IMultirespondentFormModel => {
  // Load or build base model first
  getFormModel(db)
  return db.model(FormResponseMode.Multirespondent) as IMultirespondentFormModel
}

export default getFormModel
