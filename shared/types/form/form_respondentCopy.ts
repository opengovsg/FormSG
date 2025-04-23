import { FormDto } from './form'

export type SubmitFormRespondentCopyDto = {
  formId: FormDto['_id']
  respondentCopySecretKey: string
  respondentCopyPresignedUrl: string
  mrfStep: string
}
