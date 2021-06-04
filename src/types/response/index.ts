import { BasicField, IFieldSchema, IMyInfo } from '../field'

export type AttachmentsMap = Record<IFieldSchema['_id'], File>

export interface IBaseResponse {
  _id: IFieldSchema['_id']
  fieldType: BasicField
  myInfo?: IMyInfo
  // Signature exists for verifiable fields if the answer is verified.
  signature?: string
}

export interface ISingleAnswerResponse extends IBaseResponse {
  fieldType: Exclude<
    BasicField,
    BasicField.Table | BasicField.Checkbox | BasicField.Attachment
  >
  answer: string
}

export interface IAttachmentResponse extends IBaseResponse {
  fieldType: BasicField.Attachment
  filename: string
  content: Buffer
  answer: string
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

export type DisplayedResponse = {
  _id: string
  question: string
  answer?: string
  answerArray: AnswerArray
  fieldType: string
  isHeader?: boolean
}

type AnswerArray = string[] | string[][]

export interface SingleDimResponse
  extends Omit<DisplayedResponse, 'answerArray'> {
  answerArray: Extract<AnswerArray, string[]>
}

export interface TwoDimResponse extends Omit<DisplayedResponse, 'answerArray'> {
  answerArray: Extract<AnswerArray, string[][]>
}
