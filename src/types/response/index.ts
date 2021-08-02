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
