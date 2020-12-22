import { UnreachableCaseError } from 'ts-essentials'

import { AuthType } from '../../../types'

import {
  CpVerifiedContent,
  GetVerifiedContentParams,
  SpVerifiedContent,
  VerifiedContentResult,
} from './verified-content.types'
import {
  assertCpVerifiedContentShape,
  assertSpVerifiedContentShape,
  mapDataToKey,
} from './verified-content.utils'

export const getVerifiedContent = ({
  type,
  data,
}: GetVerifiedContentParams): VerifiedContentResult<
  CpVerifiedContent | SpVerifiedContent
> => {
  const processedVerifiedContent = mapDataToKey({ type, data })
  switch (type) {
    case AuthType.SP:
      return assertSpVerifiedContentShape(processedVerifiedContent)
    case AuthType.CP:
      return assertCpVerifiedContentShape(processedVerifiedContent)
    default:
      throw new UnreachableCaseError(type)
  }
}
