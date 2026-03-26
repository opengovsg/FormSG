// The constituents of the X-FormSG-Signature
export type HeaderSignature = {
  // The ed25519 signature
  v1: string
  // The epoch used for signing, number of milliseconds since Jan 1, 1970
  t: number
  // The submission ID, usually the MongoDB submission ObjectId
  s: string
  // The form ID, usually the MongoDB form ObjectId
  f: string
}

// The constituents of the verification signature
// Note that even though this is similar to HeaderSignature, the keys do not
// mean the same thing.
export type VerificationSignature = {
  // The transaction id.
  v: string
  // The epoch used for signing, number of milliseconds since Jan 1, 1970
  t: number
  // The signature component.
  s: string
  // The form ID, usually the MongoDB form ObjectId
  f: string
}

/**
 * Helper function to retrieve keys-values in a signature.
 * @param signature The signature to convert to a keymap
 * @returns The key-value map of the signature
 */
const signatureToKeyMap = (signature: string) => {
  return signature
    .split(',')
    .map((kv) => kv.split(/=(.*)/))
    .reduce((acc: Record<string, string>, [k, v]) => {
      acc[k] = v
      return acc
    }, {})
}

/**
 * Parses the X-FormSG-Signature header into its constituents
 * @param header The X-FormSG-Signature header
 * @returns The signature header constituents
 */
export const parseSignatureHeader = (header: string): HeaderSignature => {
  const parsedSignature = signatureToKeyMap(header) as Record<
    string,
    string | number
  >

  parsedSignature.t = Number(parsedSignature.t)

  return parsedSignature as HeaderSignature
}

/**
 * Parses the verification signature into its constituent
 * @param signature The verification signature
 * @returns The verification signature constituents
 */
export const parseVerificationSignature = (
  signature: string
): VerificationSignature => {
  const parsedSignature = signatureToKeyMap(signature) as Record<
    string,
    string | number
  >

  parsedSignature.t = Number(parsedSignature.t)

  return parsedSignature as VerificationSignature
}
