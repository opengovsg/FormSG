import { BasicFieldType, IFieldSchema, IMyInfo } from './field'

export type AttachmentsMap = Record<IFieldSchema['_id'], File>

interface BaseResponse {
  _id: IFieldSchema['_id']
  fieldType: BasicFieldType
  question: string
  myInfo?: IMyInfo
}

export interface SingleAnswerResponse extends BaseResponse {
  answer: string
}

export interface CheckboxResponse extends BaseResponse {
  answerArray: string[]
}

export interface TableResponse extends BaseResponse {
  answerArray: string[][]
}

export type FieldResponse =
  | SingleAnswerResponse
  | CheckboxResponse
  | TableResponse

interface ClientSubmission {
  attachments: AttachmentsMap
  captchaResponse: string
  isPreview: boolean
  responses: FieldResponse[]
}

export interface ClientEmailSubmission extends ClientSubmission {}

export interface ClientEncryptSubmission extends ClientSubmission {
  encryptedContent: string
  version: number
}
