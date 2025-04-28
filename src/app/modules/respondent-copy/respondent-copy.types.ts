import { ControllerHandler } from '../core/core.types'

export type DecryptRespondentCopySubmissionHandlerType = ControllerHandler<
  { formId: string; submissionId: string },
  unknown,
  {
    respondentCopySecretKey: string
    respondentCopyPresignedUrl: string
    mrfStep?: number
    emails: string[]
  }, // ReqBody
  unknown
>

export type DecryptRespondentCopySubmissionRequest =
  Parameters<DecryptRespondentCopySubmissionHandlerType>[0] & {
    unencryptedContent: string
  }
