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
    })
  | undefined => {
  if (!submission || !secretKey) return

  const { encryptedContent, version, ...rest } = submission

  const decryptedContent = formsgSdk.cryptoV3.decryptFromSubmissionKey(
    secretKey,
    {
      encryptedContent,
      // verifiedContent: verified,
      version,
    },
  )
  if (!decryptedContent) throw new Error('Could not decrypt the response')

  // Add metadata for display.
  return {
    ...rest,
    responses: decryptedContent.responses as FieldResponsesV3,
  }
}
