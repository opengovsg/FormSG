import { FormFieldResponse } from 'shared/types'

import { IPopulatedEmailForm } from '../../../../types'
import { ProcessedResponse } from '../submission.types'

import ParsedResponsesObject from './ParsedResponsesObject.class'

// When a response has been formatted for email, all answerArray
// should have been converted to answer
export type ResponseFormattedForEmail = Omit<
  FormFieldResponse,
  'answerArray'
> & {
  answer: string
} & ProcessedResponse

export interface ParsedMultipartForm {
  responses: FormFieldResponse[]
}

export interface SubmissionHash {
  hash: string
  salt: string
}

export interface IPopulatedEmailFormWithResponsesAndHash {
  form: IPopulatedEmailForm
  parsedResponses: ParsedResponsesObject
  hashedFields?: Set<string>
}
