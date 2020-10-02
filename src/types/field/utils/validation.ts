import { Either } from 'fp-ts/lib/Either'

import { ProcessedFieldResponse } from 'src/app/modules/submission/submission.types'

export type ResponseValidator = (
  response: ProcessedFieldResponse,
) => Either<string, boolean>
