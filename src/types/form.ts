import { Document, LeanDocument, Model, ToObjectOptions } from 'mongoose'
import { Merge, SetRequired } from 'type-fest'

import { OverrideProps } from '../app/modules/form/admin-form/admin-form.types'

import { IFieldSchema, MyInfoAttribute } from './field'
import { ILogicSchema } from './form_logic'
import { FormLogoState, IFormLogo } from './form_logo'
import { IPopulatedUser, IUserSchema } from './user'

export enum AuthType {
  NIL = 'NIL',
  SP = 'SP',
  CP = 'CP',
}

export enum Status {
  Private = 'PRIVATE',
  Public = 'PUBLIC',
  Archived = 'ARCHIVED',
}

export enum Colors {
  Blue = 'blue',
  Red = 'red',
  Green = 'green',
  Orange = 'orange',
  Brown = 'brown',
  Grey = 'grey',
}

export enum ResponseMode {
  Encrypt = 'encrypt',
  Email = 'email',
}

// Typings
export type FormOtpData = {
  form: IFormSchema['_id']
  formAdmin: {
    email: IUserSchema['email']
    userId: IUserSchema['_id']
  }
  // Used for sending with the correct twilio
  msgSrvcName?: string
}

export type Logo = {
  state: FormLogoState
}

export type StartPage = {
  paragraph?: string
  estTimeTaken?: number
  colorTheme?: Colors
  logo?: IFormLogo
}

export type EndPage = {
  title?: string
  paragraph?: string
  buttonLink?: string
  buttonText?: string
}

export type Permission = {
  email: string
  write: boolean
}

export type Webhook = {
  url: string
}

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
  | 'responseMode'
>
export interface IForm {
  title: string
  form_fields?: IFieldSchema[]
  form_logics?: ILogicSchema[]
  admin: IUserSchema['_id']
  permissionList?: Permission[]

  startPage?: StartPage
  endPage?: EndPage

  hasCaptcha?: boolean
  authType?: AuthType

  customLogo?: string
  status?: Status

  inactiveMessage?: string
  isListed?: boolean
  esrvcId?: string
  webhook?: Webhook
  msgSrvcName?: string

  responseMode: ResponseMode

  // Schema properties
  created?: Date
  lastModified?: Date

  publicKey?: string
  // string type is allowed due to a setter on the form schema that transforms
  // strings to string array.
  emails?: string[] | string
}

export interface IFormSchema extends IForm, Document {
  /**
   * Returns the dashboard form view of the form.
   * @param admin the admin to inject into the returned object
   * @returns dashboard form view object
   */
  getDashboardView(admin: IPopulatedUser): FormMetaView
  getUniqueMyInfoAttrs(): MyInfoAttribute[]
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
   * Return essential form creation parameters with the given properties.
   * @param overrideProps the props to override on the duplicated form
   * @returns params required to create a new duplicated form object
   */
  getDuplicateParams(
    overrideProps: OverrideProps,
  ): PickDuplicateForm & OverrideProps
}

/**
 * Schema type with defaults populated and thus set to be defined.
 */
export interface IFormDocument extends IFormSchema {
  form_logics: NonNullable<IFormSchema['form_logics']>
  permissionList: NonNullable<IFormSchema['permissionList']>
  hasCaptcha: NonNullable<IFormSchema['hasCaptcha']>
  authType: NonNullable<IFormSchema['authType']>
  status: NonNullable<IFormSchema['status']>
  inactiveMessage: NonNullable<IFormSchema['inactiveMessage']>
  isListed: NonNullable<IFormSchema['isListed']>
  form_fields: NonNullable<IFormSchema['form_fields']>
  startPage: SetRequired<NonNullable<IFormSchema['startPage']>, 'colorTheme'>
  endPage: SetRequired<
    NonNullable<IFormSchema['endPage']>,
    'title' | 'buttonText'
  >
  webhook: SetRequired<NonNullable<IFormSchema['webhook']>, 'url'>
}
export interface IPopulatedForm extends Omit<IFormDocument, 'toJSON'> {
  // Remove extraneous keys that the populated form should not require.
  admin: Merge<
    Omit<
      IPopulatedUser,
      '__v' | 'created' | 'lastModified' | 'updatedAt' | 'lastAccessed'
    >,
    {
      agency: Omit<
        IPopulatedUser['agency'],
        '__v' | 'created' | 'lastModified' | 'updatedAt'
      >
    }
  >

  // Override types.
  toJSON(options?: ToObjectOptions): LeanDocument<IPopulatedForm>
}

export interface IEncryptedForm extends IForm {
  publicKey: string
  emails: never
}

export type IEncryptedFormSchema = IEncryptedForm & IFormSchema

export interface IEmailForm extends IForm {
  // string type is allowed due to a setter on the form schema that transforms
  // strings to string array.
  emails: string[] | string
  publicKey: never
}

export type IEmailFormSchema = IEmailForm & IFormSchema

export interface IFormModel extends Model<IFormSchema> {
  getOtpData(formId: string): Promise<FormOtpData | null>
  getFullFormById(formId: string): Promise<IPopulatedForm | null>
  deactivateById(formId: string): Promise<IFormSchema | null>
  getMetaByUserIdOrEmail(
    userId: IUserSchema['_id'],
    userEmail: IUserSchema['email'],
  ): Promise<FormMetaView[]>
}

export type IEncryptedFormModel = Merge<IFormModel, Model<IEncryptedFormSchema>>
export type IEmailFormModel = Merge<IFormModel, Model<IEmailFormSchema>>

/** Typing for the shape of the important meta subset for form document. */
export type FormMetaView = Pick<
  IFormSchema,
  'title' | 'lastModified' | 'status' | '_id' | 'responseMode'
> & {
  admin: IPopulatedUser
}
