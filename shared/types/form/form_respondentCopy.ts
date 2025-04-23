export type SubmitFormRespondentCopyDto = {
  emails?: string[]
  respondentCopySecretKey: string
  respondentCopyPresignedUrl: string
  mrfStep?: number
}
