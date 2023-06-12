import { FormDto } from './form'

export type FormIssueFeedbackBodyDto = {
  isPreview?: boolean
  issue: string
  email?: string
  formId: FormDto['_id']
}
