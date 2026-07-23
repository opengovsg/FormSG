import type { FieldResponsesV4, FormFieldsV3 } from '@opengovsg/formsg-sdk'
import { adaptV3ToV4, isFieldResponsesV4 } from '@opengovsg/formsg-sdk'
import {
  EncryptedAttachmentContent,
  EncryptedFileContent,
} from '@opengovsg/formsg-sdk/dist/types'
import { decode as decodeBase64 } from '@stablelib/base64'

import {
  BasicField,
  PublicMultirespondentSubmissionDto,
} from 'formsg-shared/types'

import formsgSdk from '~utils/formSdk'

export type DecryptedSubmission = Omit<
  PublicMultirespondentSubmissionDto,
  'encryptedContent' | 'version'
> & {
  responses: FieldResponsesV4
  submissionSecretKey: string
  /**
   * Attachment contents embedded in the encrypted blob itself, keyed by field
   * ID. Only present for legacy submissions stored before attachments moved
   * out of the blob (mrfVersion == null) — the embedded `content` key is not
   * part of the V3 response types and is dropped by adaptV3ToV4, so it is
   * harvested here before adaptation.
   */
  legacyAttachmentContents?: Record<string, Uint8Array<ArrayBuffer>>
}

/**
 * Normalizes decrypted responses to V4, the FE's working format.
 * V3-stored blobs (mrfVersion 1 / legacy) are adapted to V4; question text is
 * irrelevant for prefill so no form fields are provided, and provenance is
 * left empty rather than fabricating timestamps.
 */
const normalizeToV4 = (rawResponses: unknown): FieldResponsesV4 =>
  isFieldResponsesV4(rawResponses as Record<string, unknown>)
    ? (rawResponses as FieldResponsesV4)
    : adaptV3ToV4(rawResponses as FormFieldsV3, { provenance: {} })

const harvestLegacyAttachmentContents = (
  rawResponses: Record<string, { fieldType?: string; answer?: unknown }>,
): Record<string, Uint8Array<ArrayBuffer>> | undefined => {
  if (isFieldResponsesV4(rawResponses)) return undefined
  const contents: Record<string, Uint8Array<ArrayBuffer>> = {}
  for (const [id, response] of Object.entries(rawResponses)) {
    if (response.fieldType !== BasicField.Attachment) continue
    const content = (
      response.answer as { content?: { data?: ArrayLike<number> } } | undefined
    )?.content
    if (content?.data) {
      contents[id] = Uint8Array.from(content.data)
    }
  }
  return Object.keys(contents).length > 0 ? contents : undefined
}

/**
 * Decrypts a submission using the secret key
 * @param param0
 * @returns
 * @throws Error('Encrypted submission undefined')
 * @throws Error('Secret key undefined')
 */
export const decryptSubmission = ({
  submission,
  secretKey,
}: {
  submission?: PublicMultirespondentSubmissionDto
  secretKey?: string
}): DecryptedSubmission | undefined => {
  if (!submission) throw Error('Encrypted submission undefined')
  if (!secretKey) throw Error('Secret key undefined')

  // For testing, do not perform decryption and return the encrypted content
  // directly (an un-encrypted V3 or V4 responses object)
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
  if (isTest) {
    return {
      ...submission,
      responses: normalizeToV4(JSON.parse(submission.encryptedContent)),
      submissionSecretKey: secretKey,
    }
  }

  const { encryptedContent, version, ...rest } = submission

  const decryptedContent = formsgSdk.cryptoV3.decryptFromSubmissionKey(
    secretKey,
    { encryptedContent, version },
  )
  if (!decryptedContent) throw new Error('Could not decrypt the response')

  const rawResponses = decryptedContent.responses

  // Add metadata for display.
  return {
    ...rest,
    responses: normalizeToV4(rawResponses),
    legacyAttachmentContents: harvestLegacyAttachmentContents(rawResponses),
    submissionSecretKey: secretKey,
  }
}

/**
 * Decrypts an attachment using the secret key
 * @param attachment
 * @param secretKey
 * @returns
 * @throws Error('Encrypted submission undefined')
 * @throws Error('Secret key undefined')
 */
export const decryptAttachment = async (
  attachment: EncryptedFileContent,
  secretKey: string,
): Promise<Uint8Array<ArrayBuffer> | null> => {
  if (!attachment) throw Error('Encrypted submission undefined')
  if (!secretKey) throw Error('Secret key undefined')

  // RATIONALE: For casting to Uint8Array<ArrayBuffer>, after TS update, Uint8Array can be SharedArrayBuffer, which is not compatible with Blob.
  // Hence, until we update the SDK return type, we cast to Uint8Array<ArrayBuffer> to ensure compatibility.
  const decryptedContent = (await formsgSdk.crypto.decryptFile(
    secretKey,
    attachment,
  )) as Uint8Array<ArrayBuffer>

  if (!decryptedContent) throw new Error('Could not decrypt the response')

  return decryptedContent
}

/**
 * Converts an encrypted attachment to encrypted file content
 * @param encryptedAttachment The encrypted attachment
 * @returns EncryptedFileContent The encrypted file content
 */
export const convertEncryptedAttachmentToFileContent = (
  encryptedAttachment: EncryptedAttachmentContent,
): EncryptedFileContent => ({
  submissionPublicKey: encryptedAttachment.encryptedFile.submissionPublicKey,
  nonce: encryptedAttachment.encryptedFile.nonce,
  binary: decodeBase64(encryptedAttachment.encryptedFile.binary),
})
