import { EncryptedFileContent } from '@opengovsg/formsg-sdk/dist/types'

import { MultirespondentSubmissionDto } from '~shared/types'

export type MultirespondentSubmissionDtoWithAttachments =
  MultirespondentSubmissionDto & {
    encryptedAttachments: Record<string, EncryptedFileContent>
  }
