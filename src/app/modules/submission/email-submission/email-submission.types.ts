import { BasicField, FieldResponse, IBaseResponse } from '../../../../types'
import { ProcessedResponse } from '../submission.types'

// When a response has been formatted for email, all answerArray
// should have been converted to answer
interface IResponseFormattedForEmail extends IBaseResponse {
  question: string
  fieldType: BasicField
  answer: string
}

export type ResponseFormattedForEmail = IResponseFormattedForEmail &
  ProcessedResponse

export interface ParsedMultipartForm {
  responses: FieldResponse[]
}

export interface SubmissionHash {
  hash: string
  salt: string
}
