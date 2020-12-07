import { BasicField, IFieldSchema, IMyInfo } from '../field'

export type AttachmentsMap = Record<IFieldSchema['_id'], File>

export interface IBaseResponse {
  _id: IFieldSchema['_id']
  fieldType: BasicField
  question: string
  myInfo?: IMyInfo
}

export interface ISingleAnswerResponse extends IBaseResponse {
  fieldType: Exclude<BasicField, BasicField.Table | BasicField.Checkbox>
  answer: string
}

export interface IAttachmentResponse extends ISingleAnswerResponse {
  fieldType: BasicField.Attachment
  filename: string
  content: Buffer
}

export interface ICheckboxResponse extends IBaseResponse {
  fieldType: BasicField.Checkbox
  answerArray: string[]
}

export type ITableRow = string[]

export interface ITableResponse extends IBaseResponse {
  fieldType: BasicField.Table
  answerArray: ITableRow[]
}

export type FieldResponse =
  | ISingleAnswerResponse
  | ICheckboxResponse
  | ITableResponse
  | IAttachmentResponse

interface IClientSubmission {
  attachments: AttachmentsMap
  captchaResponse: string
  isPreview: boolean
  responses: FieldResponse[]
}

export type IClientEmailSubmission = IClientSubmission

export interface IClientEncryptSubmission extends IClientSubmission {
  encryptedContent: string
  version: number
}
