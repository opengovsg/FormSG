import { err, ok } from 'neverthrow'

import { VerifiedKeys } from '../../../../shared/utils/verified-content'

import { MalformedVerifiedContentError } from './verified-content.errors'
import {
  CpVerifiedContent,
  SgidVerifiedContent,
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
  return cpKeys.every((cpKey) => {
    if (cpKey in data && typeof data[cpKey] === 'string') return true

    // Check for any step-suffixed key
    const stepKeyPattern = new RegExp(`^${cpKey} \\(Step \\d+\\)$`)
    return Object.keys(data).some(
      (k) => stepKeyPattern.test(k) && typeof data[k] === 'string',
    )
  })
}

/**
 * Typeguard to assert that the given data has the shape of `SpVerifiedContent`.
 */
const isSpVerifiedContent = (
  data: Record<string, unknown>,
): data is SpVerifiedContent => {
  if (typeof data[VerifiedKeys.SpUinFin] === 'string') return true

  // Check for any step-suffixed key
  const stepKeyPattern = new RegExp(
    `^${VerifiedKeys.SpUinFin} \\(Step \\d+\\)$`,
  )
  return Object.keys(data).some(
    (k) => stepKeyPattern.test(k) && typeof data[k] === 'string',
  )
}

/**
 * Typeguard to assert that the given data has the shape of `SgidVerifiedContent`.
 */
const isSgidVerifiedContent = (
  data: Record<string, unknown>,
): data is SgidVerifiedContent => {
  return typeof data[VerifiedKeys.SgidUinFin] === 'string'
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
  // Decide whether to suffix with step number
  const stepNumber =
    data.stepNumber !== undefined ? ` (Step ${data.stepNumber})` : ``
  // Create new CorpPass verifiedContent object from current data.
  // Extract value of data.uinFin and data.userInfo set to their respective new keys.
  const createdCpVerifiedContent = {
    [`${VerifiedKeys.CpUen}${stepNumber}`]: data.uinFin,
    [`${VerifiedKeys.CpUid}${stepNumber}`]: data.userInfo,
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
  // Decide whether to suffix with step number
  const key =
    data.stepNumber !== undefined
      ? `${VerifiedKeys.SpUinFin} (Step ${data.stepNumber})`
      : VerifiedKeys.SpUinFin

  // Create new SingPass verifiedContent object from current data.
  // Extract value of data.uinFin set to new VerifiedKeys.SpUinFin key.

  const createdSpVerifiedContent = {
    [key]: data.uinFin,
  }

  // Check if the newly created object is of expected shape.
  return isSpVerifiedContent(createdSpVerifiedContent)
    ? ok(createdSpVerifiedContent)
    : err(new MalformedVerifiedContentError())
}

/**
 * Retrieve Sgid verified content object from given data.
 * @param data the data to retrieve the verified content object from
 * @returns ok(verified content object) if retrieved object is of valid expected shape
 * @returns err(MalformedVerifiedContentError) if object cannot be retrieved
 */
export const getSgidVerifiedContent = (
  data: Record<string, unknown>,
): VerifiedContentResult<SgidVerifiedContent> => {
  // Create new Sgid verifiedContent object from current data.
  // Extract value of data.uinFin set to new VerifiedKeys.SgidUinFin key.
  const createdSgidVerifiedContent = {
    [VerifiedKeys.SgidUinFin]: data.uinFin,
  }

  // Check if the newly created object is of expected shape.
  return isSgidVerifiedContent(createdSgidVerifiedContent)
    ? ok(createdSgidVerifiedContent)
    : err(new MalformedVerifiedContentError())
}
