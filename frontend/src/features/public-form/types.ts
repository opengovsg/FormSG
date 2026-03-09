import { EncryptedFileContent } from '@opengovsg/formsg-sdk/dist/types'

import { PublicMultirespondentSubmissionDto } from 'formsg-shared/types'

export type PublicMultirespondentSubmissionDtoWithAttachments =
  PublicMultirespondentSubmissionDto & {
    encryptedAttachments: Record<string, EncryptedFileContent>
  }
