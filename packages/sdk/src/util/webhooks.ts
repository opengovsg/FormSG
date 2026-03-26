import * as url from 'url'

import { WebhookAuthenticateError } from '../errors'

import { HeaderSignature } from './parser'
import { verify } from './signature'

/**
 * Helper function to construct the basestring and verify the signature of an
 * incoming request
 * @param uri incoming request to verify
 * @param signatureHeader the X-FormSG-Signature header to verify against
 * @returns true if verification succeeds, false otherwise
 * @throws {WebhookAuthenticateError} if given signature header is malformed.
 */
const isSignatureHeaderValid = (
  uri: string,
  signatureHeader: HeaderSignature,
  publicKey: string
) => {
  const {
    v1: signature,
    t: epoch,
    s: submissionId,
    f: formId,
  } = signatureHeader

  if (!epoch || !signature || !submissionId || !formId) {
    throw new WebhookAuthenticateError('X-FormSG-Signature header is invalid')
  }

  const baseString = `${url.parse(uri).href}.${submissionId}.${formId}.${epoch}`
  return verify(baseString, signature, publicKey)
}

/**
 * Helper function to verify that the epoch submitted is recent and valid.
 * Prevents against replay attacks. Allows for negative time interval
 * in case of clock drift between Form servers and recipient server.
 * @param epoch The number of milliseconds since 1 Jan 1970 00:00:00 UTC.
 * @param expiry Duration of expiry in milliseconds. The default is 5 minutes.
 * @returns true if the epoch given has exceeded expiry duration calculated from current time.
 */
const hasEpochExpired = (epoch: number, expiry = 300000) => {
  const difference = Math.abs(Date.now() - epoch)
  return difference > expiry
}

export { isSignatureHeaderValid, hasEpochExpired }
