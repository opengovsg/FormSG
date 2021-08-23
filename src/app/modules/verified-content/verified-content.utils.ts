import { err, ok } from 'neverthrow'

import { VerifiedKeys } from '../../../../shared/utils/verified-content'

import { MalformedVerifiedContentError } from './verified-content.errors'
import {
  CpVerifiedContent,
  SpVerifiedContent,
  VerifiedContentResult,
} from './verified-content.types'

/**
 * Typeguard to assert that the given data has the shape of `CpVerifiedContent`.
 */
const isCpVerifiedContent = (
  data: Record<string, unknown>,
): data is CpVerifiedContent => {
  const cpKeys: (keyof CpVerifiedContent)[] = [
    VerifiedKeys.CpUen,
    VerifiedKeys.CpUid,
  ]
  return cpKeys.every(
    (cpKey) => cpKey in data && typeof data[cpKey] === 'string',
  )
}

/**
 * Typeguard to assert that the given data has the shape of `SpVerifiedContent`.
 */
const isSpVerifiedContent = (
  data: Record<string, unknown>,
): data is SpVerifiedContent => {
  return typeof data[VerifiedKeys.SpUinFin] === 'string'
}

/**
 * Retrieve CorpPass verified content object from given data.
 * @param data the data to retrieve the verified content object from
 * @returns ok(verified content object) if retrieved object is of valid expected shape
 * @returns err(MalformedVerifiedContentError) if object cannot be retrieved
 */
export const getCpVerifiedContent = (
  data: Record<string, unknown>,
): VerifiedContentResult<CpVerifiedContent> => {
  // Create new CorpPass verifiedContent object from current data.
  // Extract value of data.uinFin and data.userInfo set to their respective new keys.
  const createdCpVerifiedContent = {
    [VerifiedKeys.CpUen]: data.uinFin,
    [VerifiedKeys.CpUid]: data.userInfo,
  }

  // Check if the newly created object is of expected shape.
  return isCpVerifiedContent(createdCpVerifiedContent)
    ? ok(createdCpVerifiedContent)
    : err(new MalformedVerifiedContentError())
}

/**
 * Retrieve SingPass verified content object from given data.
 * @param data the data to retrieve the verified content object from
 * @returns ok(verified content object) if retrieved object is of valid expected shape
 * @returns err(MalformedVerifiedContentError) if object cannot be retrieved
 */
export const getSpVerifiedContent = (
  data: Record<string, unknown>,
): VerifiedContentResult<SpVerifiedContent> => {
  // Create new SingPass verifiedContent object from current data.
  // Extract value of data.uinFin set to new VerifiedKeys.SpUinFin key.
  const createdSpVerifiedContent = {
    [VerifiedKeys.SpUinFin]: data.uinFin,
  }

  // Check if the newly created object is of expected shape.
  return isSpVerifiedContent(createdSpVerifiedContent)
    ? ok(createdSpVerifiedContent)
    : err(new MalformedVerifiedContentError())
}
