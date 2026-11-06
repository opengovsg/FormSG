import { FieldResponse } from '../../../../types'
import { MyInfoKey } from '../../myinfo/myinfo.types'
import ParsedResponsesObject from '../ParsedResponsesObject.class'
import { ProcessedResponse } from '../submission.types'

// When a response has been formatted for email, all answerArray
// should have been converted to answer
export type ResponseFormattedForEmail = Omit<FieldResponse, 'answerArray'> & {
  answer: string
  answerTemplate?: string[]
} & ProcessedResponse

export interface IPopulatedStorageFormWithResponsesAndHash {
  parsedResponses: ParsedResponsesObject
  hashedFields?: Set<MyInfoKey>
}
