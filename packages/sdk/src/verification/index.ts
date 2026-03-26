/**
 * @file Manages verification of otp form fields (email, sms, whatsapp)
 * @author Jean Tan
 */
import nacl from 'tweetnacl'
import { decodeBase64, decodeUTF8, encodeBase64 } from 'tweetnacl-util'

import { MissingPublicKeyError, MissingSecretKeyError } from '../errors'
import {
  VerificationAuthenticateOptions,
  VerificationOptions,
  VerificationSignatureOptions,
} from '../types'
import { parseVerificationSignature } from '../util/parser'

import { formatToBaseString, isSignatureTimeValid } from './utils'

export default class Verification {
  verificationPublicKey?: string
  verificationSecretKey?: string
  transactionExpiry?: number

  constructor(params?: VerificationOptions) {
    this.verificationPublicKey = params?.publicKey
    this.verificationSecretKey = params?.secretKey
    this.transactionExpiry = params?.transactionExpiry
  }

  /**
   *  Verifies signature
   * @param {object} data
   * @param {string} data.signatureString
   * @param {number} data.submissionCreatedAt date in milliseconds
   * @param {string} data.fieldId
   * @param {string} data.answer
   * @param {string} data.publicKey
   */
  authenticate = ({
    signatureString,
    submissionCreatedAt,
    fieldId,
    answer,
  }: VerificationAuthenticateOptions) => {
    if (!this.transactionExpiry) {
      throw new Error(
        'Provide a transaction expiry when when initializing the FormSG SDK to use this function.'
      )
    }

    if (!this.verificationPublicKey) {
      throw new MissingPublicKeyError()
    }

    try {
      const {
        v: transactionId,
        t: time,
        f: formId,
        s: signature,
      } = parseVerificationSignature(signatureString)

      if (!time) {
        throw new Error('Malformed signature string was passed into function')
      }

      if (
        isSignatureTimeValid(time, submissionCreatedAt, this.transactionExpiry)
      ) {
        const data = formatToBaseString({
          transactionId,
          formId,
          fieldId,
          answer,
          time,
        })

        return nacl.sign.detached.verify(
          decodeUTF8(data),
          decodeBase64(signature),
          decodeBase64(this.verificationPublicKey)
        )
      } else {
        console.info(
          `Signature was expired for signatureString="${signatureString}" signatureDate="${time}" submissionCreatedAt="${submissionCreatedAt}"`
        )
        return false
      }
    } catch (error) {
      console.error(`An error occurred for \
            signatureString="${signatureString}" \
            submissionCreatedAt="${submissionCreatedAt}" \
            fieldId="${fieldId}" \
            answer="${answer}" \
            error="${error}"`)
      return false
    }
  }

  generateSignature = ({
    transactionId,
    formId,
    fieldId,
    answer,
  }: VerificationSignatureOptions): string => {
    if (!this.verificationSecretKey) {
      throw new MissingSecretKeyError(
        'Provide a secret key when when initializing the Verification class to use this function.'
      )
    }

    const time = Date.now()
    const data = formatToBaseString({
      transactionId,
      formId,
      fieldId,
      answer,
      time,
    })
    const signature = nacl.sign.detached(
      decodeUTF8(data),
      decodeBase64(this.verificationSecretKey)
    )
    return `f=${formId},v=${transactionId},t=${time},s=${encodeBase64(
      signature
    )}`
  }
}
