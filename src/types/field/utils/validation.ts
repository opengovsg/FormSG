import { Either } from 'fp-ts/lib/Either'

import { ISingleAnswerResponse } from 'src/types/response'

export type SingleAnswerResponseValidator = (
  response: ISingleAnswerResponse,
) => Either<string, ISingleAnswerResponse>
