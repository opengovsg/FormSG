import { FieldResponsesV3, MultirespondentSubmissionDto } from '~shared/types'

import formsgSdk from '~utils/formSdk'

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

  // Add metadata for display.
  return {
    ...rest,
    responses: decryptedContent.responses as FieldResponsesV3,
    submissionSecretKey: secretKey,
  }
}
