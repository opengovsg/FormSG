import {
  EncryptedAttachmentContent,
  EncryptedFileContent,
} from '@opengovsg/formsg-sdk/dist/types'
import { decode as decodeBase64 } from '@stablelib/base64'

import {
  FieldResponsesV3,
  PublicMultirespondentSubmissionDto,
} from '~shared/types'

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
  submission?: PublicMultirespondentSubmissionDto
  secretKey?: string
}):
  | (Omit<
      PublicMultirespondentSubmissionDto,
      'encryptedContent' | 'version'
    > & {
      responses: FieldResponsesV3
      submissionSecretKey: string
    })
  | undefined => {
  if (!submission) throw Error('Encrypted submission undefined')
  if (!secretKey) throw Error('Secret key undefined')

  // For testing, do not perform decryption and return the encrypted content directly
  // (which will be a un-encrypted FieldResponsesV3 object)
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
  if (isTest) {
    return {
      ...submission,
      responses: JSON.parse(
        submission.encryptedContent,
      ) as unknown as FieldResponsesV3,
      submissionSecretKey: secretKey,
    }
  }

  const { encryptedContent, version, ...rest } = submission

  const decryptedContent = formsgSdk.cryptoV3.decryptFromSubmissionKey(
    secretKey,
    { encryptedContent, version },
  )
  if (!decryptedContent) throw new Error('Could not decrypt the response')

  // Add metadata for display.
  return {
    ...rest,
    responses: decryptedContent.responses as FieldResponsesV3,
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
