import {
  EncryptedAttachmentContent,
  EncryptedFileContent,
} from '@opengovsg/formsg-sdk/dist/types'
import { decode as decodeBase64 } from '@stablelib/base64'

import {
  BasicField,
  FieldResponsesV3,
  FieldResponseV3,
  MultirespondentSubmissionDto,
} from '~shared/types'
import { convertToSignatureVectorArray } from '~shared/utils/signature'

import formsgSdk from '~utils/formSdk'

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
  submission?: MultirespondentSubmissionDto
  secretKey?: string
}):
  | (Omit<MultirespondentSubmissionDto, 'encryptedContent' | 'version'> & {
      responses: FieldResponsesV3
      submissionSecretKey: string
    })
  | undefined => {
  if (!submission) throw Error('Encrypted submission undefined')
  if (!secretKey) throw Error('Secret key undefined')

  const { encryptedContent, version, ...rest } = submission

  const decryptedContent = formsgSdk.cryptoV3.decryptFromSubmissionKey(
    secretKey,
    { encryptedContent, version },
  )
  if (!decryptedContent) throw new Error('Could not decrypt the response')

  // Add back signature typing for consistency
  const decryptedResponses: FieldResponsesV3 = Object.keys(
    decryptedContent.responses,
  ).reduce((acc, id) => {
    const response = decryptedContent.responses[id]

    if (response.fieldType === BasicField.Signature) {
      acc[id] = {
        ...response,
        answer: {
          type: 'draw',
          value: convertToSignatureVectorArray(response.answer),
        },
      } as FieldResponseV3
    } else {
      acc[id] = response as FieldResponseV3
    }

    return acc
  }, {} as FieldResponsesV3) // Initialize as FieldResponsesV3

  // Add metadata for display.
  return {
    ...rest,
    // responses: decryptedContent.responses as FieldResponsesV3,
    responses: decryptedResponses as FieldResponsesV3,
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
): Promise<Uint8Array | null> => {
  if (!attachment) throw Error('Encrypted submission undefined')
  if (!secretKey) throw Error('Secret key undefined')

  const decryptedContent = await formsgSdk.crypto.decryptFile(
    secretKey,
    attachment,
  )

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
