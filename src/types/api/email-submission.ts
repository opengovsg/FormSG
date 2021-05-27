import { FieldResponse } from '../response'

export type EmailSubmissionDto = {
  responses: ({ question: string } & FieldResponse)[]
}
