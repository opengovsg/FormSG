import { IField } from './field'
import { ILogic } from './logic'

export interface IForm {
  title: string
  form_fields?: IField[]
  form_logics?: ILogic[]
  admin: string
  permissionList?: Permission[]

  startPage?: StartPage
  endPage?: EndPage

  hasCaptcha?: boolean
  authType?: AuthType

  status?: Status

  inactiveMessage?: string
  submissionLimit?: number | null
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

export enum AuthType {
  NIL = 'NIL',
  SP = 'SP',
  CP = 'CP',
  MyInfo = 'MyInfo',
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

export enum FormLogoState {
  Default = 'DEFAULT',
  None = 'NONE',
  Custom = 'CUSTOM',
}

export interface IFormLogo {
  state: FormLogoState
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
