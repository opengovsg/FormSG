import { FormDto } from './form'

export type PreSubmitFormFeedbackBodyDto = {
  isPreview?: boolean
  issue: string
  email?: string
  formId: FormDto['_id']
}
