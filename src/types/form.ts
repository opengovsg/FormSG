import {
  ClientSession,
  Document,
  LeanDocument,
  Model,
  ToObjectOptions,
  Types,
  UpdateWriteOpResult,
} from 'mongoose'
import { DeepRequired } from 'ts-essentials'
import type { Merge, SetOptional } from 'type-fest'

import {
  AdminDashboardFormMetaDto,
  FormBase,
  FormBusinessField,
  FormEndPage,
  FormField,
  FormFieldDto,
  FormPaymentsChannel,
  FormPaymentsField,
  FormPermission,
  FormSettings,
  FormStartPage,
  FormWebhookResponseModeSettings,
  LogicDto,
  MyInfoAttribute,
  PublicFormDto,
} from '../../shared/types'
import { OverrideProps } from '../app/modules/form/admin-form/admin-form.types'

import { PublicView } from './database'
import { FormFieldSchema } from './field'
import { FormLogicSchema } from './form_logic'
import { IPopulatedUser, IUserSchema, PublicUser } from './user'

// Typings
export type PublicForm = Merge<
  PublicFormDto,
  {
    admin: PublicUser
  }
>

export type FormOtpData = {
  form: IFormSchema['_id']
  formAdmin: {
    email: IUserSchema['email']
    userId: IUserSchema['_id']
  }
  // Used for sending with the correct twilio
  msgSrvcName?: string
}

/**
 * Keys with defaults in schema.
 */
type FormDefaultableKey =
  | 'form_fields'
  | 'form_logics'
  | 'permissionList'
  | 'startPage'
  | 'endPage'
  | 'hasCaptcha'
  | 'hasIssueNotification'
  | 'authType'
  | 'status'
  | 'inactiveMessage'
  | 'submissionLimit'
  | 'isListed'
  | 'webhook'

export type IForm = Merge<
  SetOptional<FormBase, FormDefaultableKey>,
  {
    // Loosen types here to allow for IPopulatedForm extension
    admin: any
    permission?: FormPermission[]
    form_fields?: FormFieldSchema[]
    form_logics?: FormLogicSchema[]

    webhook?: Partial<FormBase['webhook']>
    startPage?: Partial<FormBase['startPage']>
    endPage?: Partial<FormBase['endPage']>

    publicKey?: string
    // string type is allowed due to a setter on the form schema that transforms
    // strings to string array.
    emails?: string[] | string
  }
>

/**
 * Typing for duplicate form with specific keys.
 */
export type PickDuplicateForm = Pick<
  IFormSchema,
  | 'form_fields'
  | 'form_logics'
  | 'startPage'
  | 'endPage'
  | 'authType'
  | 'inactiveMessage'
  | 'submissionLimit'
  | 'responseMode'
>

export interface IFormSchema extends IForm, Document, PublicView<PublicForm> {
  form_fields?: Types.DocumentArray<FormFieldSchema> | FormFieldSchema[]
  form_logics?: Types.DocumentArray<FormLogicSchema> | FormLogicSchema[]

  created?: Date
  lastModified?: Date

  /**
   * Replaces the field corresponding to given id to given new field
   * @param fieldId the id of the field to update
   * @param newField the new field to replace with
   * @returns updated form after the update if field update is successful
   * @returns null if field not found
   * @throws validation error on invalid updates, or if new field type is different from current field type
   */
  updateFormFieldById<T>(
    this: T,
    fieldId: string,
    newField: FormFieldDto,
  ): Promise<T | null>

  updateFormCollaborators<T>(
    this: T,
    updateFormCollaborators: FormPermission[],
  ): Promise<T>

  /**
   * Duplicates a form field into the form
   * @param fieldId the fieldId of the field to duplicate
   * @param insertionIndex the index to insert the duplicated field in
   * @returns updated form after the duplication if field duplication is successful
   * @throws FieldNotFound error if field to duplicate does not exist

   */
  duplicateFormFieldByIdAndIndex<T>(
    this: T,
    fieldId: string,
    insertionIndex: number,
  ): Promise<T | null>

  /**
   * Reorders field corresponding to given fieldId to given newPosition
   * @param fieldId the id of the field to reorder
   * @param newPosition the new position to move the field to
   * @returns updated form after the reordering if field reorder is successful
   * @returns null if field is not found
   */
  reorderFormFieldById<T>(
    this: T,
    fieldId: string,
    newPosition: number,
  ): Promise<T | null>

  /**
   * Inserts a form field into the form
   * @param newField the new field to insert
   * @param to Optional position to insert the field at. If not provided, field will be inserted at the end.
   * @returns updated form after the insertion if field insertion is successful
   * @throws validation error on invalid updates
   */
  insertFormField<T>(
    this: T,
    newField: FormField,
    to?: number,
  ): Promise<T | null>

  /**
   * Returns the dashboard form view of the form.
   * @param admin the admin to inject into the returned object
   * @returns dashboard form view object
   */
  getDashboardView(admin: IPopulatedUser): AdminDashboardFormMetaDto
  getUniqueMyInfoAttrs(): MyInfoAttribute[]
  /**
   * Retrieve form settings.
   */
  getSettings(): FormSettings
  /**
   * Retrieve form webhook settings.
   */
  getWebhookAndResponseModeSettings(): FormWebhookResponseModeSettings
  /**
   * Archives form.
   * @returns form that has been archived
   */
  archive(): Promise<IFormSchema>

  /**
   * Transfer ownership of the form to another user.
   * @param currentOwner the current owner of the form. The owner is retrieved outside of the method to force validation to be performed correctly.
   * @param newOwner the new owner of the form. Similarly retrieved outside of method to force correct validation.
   * @returns updated form
   */
  transferOwner<T = IFormSchema>(
    currentOwner: IUserSchema,
    newOwner: IUserSchema,
  ): Promise<T>

  /**
   * Add payment account ID to the form.
   * @param accountId the payment account ID to add
   * @returns updated form
   */
  addPaymentAccountId<T = IEncryptedFormSchema>({
    accountId,
    publishableKey,
  }: {
    accountId: FormPaymentsChannel['target_account_id']
    publishableKey: FormPaymentsChannel['publishable_key']
  }): Promise<T & DeepRequired<Pick<IEncryptedFormSchema, 'payments_channel'>>>

  /**
   * Remove payment account ID from the form.
   * @returns updated form
   */
  removePaymentAccount<T = IEncryptedFormSchema>(): Promise<T>

  /**
   * Return essential form creation parameters with the given properties.
   * @param overrideProps the props to override on the duplicated form
   * @returns params required to create a new duplicated form object
   */
  getDuplicateParams(
    overrideProps: OverrideProps,
  ): PickDuplicateForm & OverrideProps

  /**
   * Updates the msgSrvcName of the form with the specified msgSrvcName
   * @param msgSrvcName msgSrvcName to update the Form docuemnt with
   * @param session transaction session in which update operation is a part of
   */
  updateMsgSrvcName(
    msgSrvcName: string,
    session?: ClientSession,
  ): Promise<IFormSchema>

  /**
   * Deletes the msgSrvcName of the form
   * @param session transaction session in which delete operation is a part of
   */
  deleteMsgSrvcName(session?: ClientSession): Promise<IFormSchema>
}

/**
 * Schema type with defaults populated and thus set to be defined.
 */
interface IFormBaseDocument<T extends IFormSchema> {
  form_fields: NonNullable<T['form_fields']>
  form_logics: NonNullable<T['form_logics']>
  permissionList: NonNullable<T['permissionList']>
  hasCaptcha: NonNullable<T['hasCaptcha']>
  hasIssueNotification: NonNullable<T['hasIssueNotification']>
  authType: NonNullable<T['authType']>
  status: NonNullable<T['status']>
  inactiveMessage: NonNullable<T['inactiveMessage']>
  // NOTE: Due to the way creating a form works, creating a form without specifying submissionLimit will throw an error.
  // Hence, using Exclude here over NonNullable.
  submissionLimit: Exclude<T['submissionLimit'], undefined>
  isListed: NonNullable<T['isListed']>
  startPage: Required<NonNullable<T['startPage']>>
  endPage: Required<NonNullable<T['endPage']>>
  webhook: Required<NonNullable<T['webhook']>>
  responseMode: NonNullable<T['responseMode']>
}

export type IFormDocument = IFormBaseDocument<IFormSchema> & IFormSchema

export type IEncryptedFormDocument = IFormBaseDocument<IEncryptedFormSchema> &
  IEncryptedFormSchema & {
    publickey: NonNullable<IEncryptedFormSchema['publicKey']>
  }

export interface IPopulatedForm extends Omit<IFormDocument, 'toJSON'> {
  admin: IPopulatedUser
  // Override types.
  toJSON(options?: ToObjectOptions): LeanDocument<IPopulatedForm>
}

export interface IEncryptedForm extends IForm {
  publicKey: string
  // Nested objects will always be returned from mongoose finds, even if they
  // are not defined in DB. See https://github.com/Automattic/mongoose/issues/5310
  payments_channel: FormPaymentsChannel
  payments_field: FormPaymentsField
  business?: FormBusinessField
  emails?: never
}

export type IEncryptedFormSchema = IEncryptedForm & IFormSchema

export type IPopulatedEncryptedForm = IPopulatedForm & IEncryptedForm

export interface IEmailForm extends IForm {
  // string type is allowed due to a setter on the form schema that transforms
  // strings to string array.
  emails: string[] | string
  publicKey?: never
}

export type IEmailFormSchema = IEmailForm & IFormSchema

export type IPopulatedEmailForm = IPopulatedForm & IEmailForm

export interface IFormModel extends Model<IFormSchema> {
  getOtpData(formId: string): Promise<FormOtpData | null>

  getFullFormById(
    formId: string,
    fields?: (keyof IPopulatedForm)[],
  ): Promise<IPopulatedForm | null>

  createFormLogic(
    formId: string,
    createLogicBody: LogicDto,
  ): Promise<IFormDocument | null>
  deleteFormLogic(
    formId: string,
    logicId: string,
  ): Promise<IFormDocument | null>

  /**
   * Deletes specified form field by its id from the form corresponding to given form id.
   * @param formId the id of the form to delete specific form field for
   * @param fieldId the id of the form field to delete from the form
   * @returns updated form after deletion of form field
   */
  deleteFormFieldById(
    formId: string,
    fieldId: string,
  ): Promise<IFormSchema | null>

  deactivateById(formId: string): Promise<IFormSchema | null>

  getMetaByUserIdOrEmail(
    userId: IUserSchema['_id'],
    userEmail: IUserSchema['email'],
  ): Promise<AdminDashboardFormMetaDto[]>

  disableSmsVerificationsForUser(
    userId: IUserSchema['_id'],
  ): Promise<UpdateWriteOpResult>

  /**
   * Retrieves all the public forms for a user which has sms verifications enabled
   * @param userId The userId to retrieve the forms for
   * @returns All public forms that have sms verifications enabled
   */
  retrievePublicFormsWithSmsVerification(
    userId: IUserSchema['_id'],
  ): Promise<IFormDocument[]>

  /**
   * Update the end page of form with given endpage object.
   * @param formId the id of the form to update
   * @param newEndPage the new EndPage object to replace with
   * @returns the updated form document if form exists, null otherwise
   */
  updateEndPageById(
    formId: string,
    newEndPage: FormEndPage,
  ): Promise<IFormDocument | null>

  /**
   * Update the start page of form with given startpage object.
   * @param formId the id of the form to update
   * @param newStartPage the new StartPage object to replace with
   * @returns the updated form document if form exists, null otherwise
   */
  updateStartPageById(
    formId: string,
    newStartPage: FormStartPage,
  ): Promise<IFormDocument | null>

  /**
   * Update the payments of form with given payments object.
   * @param formId the id of the form to update
   * @param newPayments the new Payments object to replace with
   * @returns the updated encrypted form document if form exists, null otherwise
   */
  updatePaymentsById(
    formId: string,
    newPayments: FormPaymentsField,
  ): Promise<IEncryptedFormDocument | null>

  updatePaymentsProductById(
    formId: string,
    newProducts: FormPaymentsField['products'],
  ): Promise<IEncryptedFormDocument | null>

  updateFormLogic(
    formId: string,
    logicId: string,
    updatedLogic: LogicDto,
  ): Promise<IFormSchema | null>

  getGoLinkSuffix(formId: string): Promise<IFormDocument | null>

  setGoLinkSuffix(
    formId: string,
    goLinkSuffix: string,
  ): Promise<IFormDocument | null>

  archiveForms(
    formIds: IFormSchema['_id'][],
    /**
     * Session is optional so that we can mock this function in our tests to test it without a session.
     * Reason is our mocked mongo database does not support transactions.
     * See issue #4503 for more details.
     */
    session?: ClientSession,
  ): Promise<void>
}

export type IEncryptedFormModel = Model<IEncryptedFormSchema> & IFormModel

export type IEmailFormModel = IFormModel & Model<IEmailFormSchema>

export type IOnboardedForm<T extends IForm> = T & {
  msgSrvcName: string
}

export type FormLinkView<T extends IFormDocument> = {
  title: T['title']
  link: string
}
