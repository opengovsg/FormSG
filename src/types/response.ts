import { BasicField, IFieldSchema, IMyInfo } from './field'

export type AttachmentsMap = Record<IFieldSchema['_id'], File>

interface IBaseResponse {
  _id: IFieldSchema['_id']
  fieldType: BasicField
  question: string
  myInfo?: IMyInfo
}

export interface ISingleAnswerResponse extends IBaseResponse {
  answer: string
}

export interface ICheckboxResponse extends IBaseResponse {
  answerArray: string[]
}

export interface ITableResponse extends IBaseResponse {
  answerArray: string[][]
}

export type FieldResponse =
  | ISingleAnswerResponse
  | ICheckboxResponse
  | ITableResponse

interface IClientSubmission {
  attachments: AttachmentsMap
  captchaResponse: string
  isPreview: boolean
  responses: FieldResponse[]
}

export interface IClientEmailSubmission extends IClientSubmission {}

export interface IClientEncryptSubmission extends IClientSubmission {
  encryptedContent: string
  version: number
}
